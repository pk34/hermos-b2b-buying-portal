import { Box, CircularProgress, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useB3Lang } from '@/lib/lang';
import { addProductsFromCartToQuote } from '@/hooks/dom/utils';
import { getCart } from '@/shared/service/bc/graphql/cart';
import { getCurrentCustomerInfo, loginInfo } from '@/utils/loginInfo';
import { store } from '@/store';
import { setB2BToken, setBcGraphQLToken } from '@/store/slices/company';

import { PageProps } from '../PageProps';

export default function CreateQuoteFromCart({ setOpenPage }: PageProps) {
    const b3Lang = useB3Lang();
    const navigate = useNavigate();

    useEffect(() => {
        const processQuote = async () => {
            try {
                // CRITICAL: Force token refresh to ensure we have valid sessions
                // This fixes the 401 error when redirecting from Storefront
                console.log('[CreateQuoteFromCart] Force clearing tokens to trigger refresh');
                store.dispatch(setB2BToken(''));
                store.dispatch(setBcGraphQLToken(''));

                // CRITICAL: Ensure both tokens are initialized before making any API calls
                const state = store.getState();
                let { B2BToken, bcGraphqlToken } = state.company.tokens;

                console.log('[CreateQuoteFromCart] Initial state - B2BToken:', B2BToken ? 'EXISTS' : 'MISSING', 'bcGraphqlToken:', bcGraphqlToken ? 'EXISTS' : 'MISSING');

                // Step 1: Ensure B2B token exists
                if (!B2BToken) {
                    console.log('[CreateQuoteFromCart] B2BToken missing, calling getCurrentCustomerInfo()');
                    const customerInfo = await getCurrentCustomerInfo();
                    if (!customerInfo) {
                        throw new Error('Failed to authenticate - please log in');
                    }
                    const updatedState = store.getState();
                    B2BToken = updatedState.company.tokens.B2BToken;
                    bcGraphqlToken = updatedState.company.tokens.bcGraphqlToken;
                    console.log('[CreateQuoteFromCart] After getCurrentCustomerInfo - B2BToken:', B2BToken ? 'EXISTS' : 'MISSING', 'bcGraphqlToken:', bcGraphqlToken ? 'EXISTS' : 'MISSING');
                }

                // Step 2: Ensure BC GraphQL token exists (required for getCart)
                if (!bcGraphqlToken) {
                    console.log('[CreateQuoteFromCart] bcGraphqlToken missing, calling loginInfo()');
                    await loginInfo();
                    const updatedState = store.getState();
                    bcGraphqlToken = updatedState.company.tokens.bcGraphqlToken;
                    console.log('[CreateQuoteFromCart] After loginInfo - bcGraphqlToken:', bcGraphqlToken ? 'EXISTS' : 'MISSING');
                }

                // Step 3: Now that we're authenticated, get the cart
                console.log('[CreateQuoteFromCart] Calling getCart() with authenticated token');
                const cartData = await getCart();

                if (!cartData?.data?.site?.cart) {
                    throw new Error('No cart found');
                }

                console.log('[CreateQuoteFromCart] Cart retrieved successfully, processing quote');

                // Step 4: Use existing logic to add cart to quote
                const { addToQuoteFromCookie } = addProductsFromCartToQuote(setOpenPage, b3Lang);
                await addToQuoteFromCookie();

                // Step 5: Navigate to quote draft page where user can see their quote
                setTimeout(() => {
                    navigate('/quoteDraft');
                }, 1000);
            } catch (error) {
                console.error('[CreateQuoteFromCart] Error processing quote:', error);
                // If error, redirect to quote draft anyway (user can try again from there)
                navigate('/quoteDraft');
            }
        };

        processQuote();
    }, [setOpenPage, b3Lang, navigate]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                padding: 4,
            }}
        >
            <CircularProgress size={60} sx={{ marginBottom: 3 }} />
            <Typography variant="h5" component="h1" gutterBottom>
                Creating your quote...
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Please wait while we process your cart items
            </Typography>
        </Box>
    );
}
