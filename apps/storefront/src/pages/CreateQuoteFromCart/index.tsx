import { Box, CircularProgress, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useB3Lang } from '@/lib/lang';
import { addProductsFromCartToQuote } from '@/hooks/dom/utils';
import { getCart } from '@/shared/service/bc/graphql/cart';

import { PageProps } from '../PageProps';

export default function CreateQuoteFromCart({ setOpenPage }: PageProps) {
    const b3Lang = useB3Lang();
    const navigate = useNavigate();

    useEffect(() => {
        const processQuote = async () => {
            try {
                // Get current cart
                const cartData = await getCart();

                if (!cartData?.data?.site?.cart) {
                    throw new Error('No cart found');
                }

                // Use existing logic to add cart to quote
                const { addToQuoteFromCookie } = addProductsFromCartToQuote(setOpenPage, b3Lang);
                await addToQuoteFromCookie();

                // Navigate to quote draft page where user can see their quote
                setTimeout(() => {
                    navigate('/quoteDraft');
                }, 1000);
            } catch (error) {
                console.error('Error processing quote:', error);
                // If error, redirect to quote draft anyway
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
