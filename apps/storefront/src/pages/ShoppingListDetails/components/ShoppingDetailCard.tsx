import { ReactElement } from 'react';
import { Delete, Edit, StickyNote2 } from '@mui/icons-material';
import { Box, CardContent, styled, Typography } from '@mui/material';

import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useB3Lang } from '@/lib/lang';
import { currencyFormat } from '@/utils';
import b2bGetVariantImageByVariantInfo from '@/utils/b2bGetVariantImageByVariantInfo';
import { getBCPrice } from '@/utils/b3Product/b3Product';

import { getProductOptionsFields } from '../../../utils/b3Product/shared/config';

interface ShoppingDetailCardProps {
  item: any;
  onEdit: (item: any, variantId: number | string, itemId: number | string) => void;
  onDelete: (itemId: number) => void;
  handleUpdateProductQty: (id: number | string, value: number | string) => boolean;
  handleUpdateShoppingListItem: (
    itemId: number | string,
    options?: { force?: boolean },
  ) => Promise<void>;
  checkBox?: () => ReactElement;
  isReadForApprove: boolean;
  len: number;
  itemIndex?: number;
  setDeleteOpen: (value: boolean) => void;
  setAddNoteItemId: (itemId: number) => void;
  setAddNoteOpen: (open: boolean) => void;
  setNotes: (value: string) => void;
  showPrice: (price: string, row: CustomFieldItems) => string | number;
  b2bAndBcShoppingListActionsPermissions: boolean;
}

const StyledImage = styled('img')(() => ({
  maxWidth: '85px',
  maxHeight: '85px',
  height: 'auto',
  marginRight: '0.5rem',
}));

const QuantityControlsContainer = styled('div')(() => ({
  display: 'inline-flex',
  alignItems: 'stretch',
  height: '40px',
}));

const quantityButtonBaseStyles = {
  width: '27px',
  backgroundColor: '#E6E6E6',
  borderTop: '0.2px solid #000000',
  borderBottom: '0.2px solid #000000',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  cursor: 'pointer',
  position: 'relative',
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
} as const;

const QuantityMinusButton = styled('button')(() => ({
  ...quantityButtonBaseStyles,
  borderLeft: '0.2px solid #000000',
  borderRight: '0px',
}));

const QuantityPlusButton = styled('button')(() => ({
  ...quantityButtonBaseStyles,
  borderLeft: '0px',
  borderRight: '0.2px solid #000000',
}));

const MinusSign = styled('span')(() => ({
  width: '14px',
  height: '2px',
  backgroundColor: '#0067A0',
  position: 'absolute',
  top: 'calc(50% - 1px)',
  left: 'calc(50% - 7px)',
}));

const PlusSign = styled('span')(() => ({
  position: 'absolute',
  width: '14px',
  height: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&::before': {
    content: "''",
    position: 'absolute',
    width: '14px',
    height: '2px',
    backgroundColor: '#0067A0',
  },
  '&::after': {
    content: "''",
    position: 'absolute',
    width: '2px',
    height: '14px',
    backgroundColor: '#0067A0',
  },
}));

const QuantityInput = styled('input')(() => ({
  width: '64px',
  backgroundColor: '#E6E6E6',
  borderLeft: '0px',
  borderRight: '0px',
  borderTop: '0.2px solid #000000',
  borderBottom: '0.2px solid #000000',
  fontFamily: 'Lato, sans-serif',
  fontWeight: 400,
  fontSize: '20px',
  lineHeight: '28px',
  textAlign: 'center',
  verticalAlign: 'middle',
  color: '#000000',
  height: '40px',
  outline: 'none',
  padding: 0,
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  '&::-webkit-outer-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  '&::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  '&[type=number]': {
    MozAppearance: 'textfield',
  },
}));

function ShoppingDetailCard(props: ShoppingDetailCardProps) {
  const b3Lang = useB3Lang();
  const {
    item: shoppingDetail,
    onEdit,
    onDelete,
    checkBox,
    handleUpdateProductQty,
    handleUpdateShoppingListItem,
    isReadForApprove,
    len,
    itemIndex,
    setDeleteOpen,
    setAddNoteOpen,
    setAddNoteItemId,
    setNotes,
    showPrice,
    b2bAndBcShoppingListActionsPermissions,
  } = props;

  const {
    basePrice,
    quantity,
    itemId,
    variantId,
    primaryImage,
    productName,
    variantSku,
    productsSearch,
    productUrl,
    taxPrice = 0,
    productNote,
  } = shoppingDetail;

  const price = getBCPrice(Number(basePrice), Number(taxPrice));

  const total = price * Number(quantity);

  const product: any = {
    ...shoppingDetail.productsSearch,
    selectOptions: shoppingDetail.optionList,
  };

  const productFields = getProductOptionsFields(product, {});

  const optionList = JSON.parse(shoppingDetail.optionList);
  const optionsValue: CustomFieldItems[] = productFields.filter((item) => item.valueText);

  const canChangeOption =
    optionList.length > 0 && !isReadForApprove && b2bAndBcShoppingListActionsPermissions;

  const currentVariants = product.variants || [];

  const currentImage =
    b2bGetVariantImageByVariantInfo(currentVariants, { variantId, variantSku }) || primaryImage;

  const numericQuantity = Number(quantity) || 0;
  const isQuantityDisabled = b2bAndBcShoppingListActionsPermissions ? isReadForApprove : true;

  return (
    <Box
      key={shoppingDetail.id}
      sx={{
        borderTop: '1px solid #D9DCE9',
        borderBottom: itemIndex === len - 1 ? '1px solid #D9DCE9' : '',
      }}
    >
      <CardContent
        sx={{
          color: '#313440',
          display: 'flex',
          pl: 0,
        }}
      >
        <Box>{checkBox && checkBox()}</Box>
        <Box>
          <StyledImage
            src={currentImage || PRODUCT_DEFAULT_IMAGE}
            alt="Product-img"
            loading="lazy"
          />
        </Box>
        <Box
          sx={{
            flex: 1,
          }}
        >
          <Typography
            variant="body1"
            onClick={() => {
              const {
                location: { origin },
              } = window;

              window.location.href = `${origin}${productUrl}`;
            }}
            sx={{
              cursor: 'pointer',
              fontFamily: 'Lato, sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#000000',
            }}
          >
            {productName}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: 'Lato, sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#000000',
            }}
          >
            {variantSku}
          </Typography>
          <Box
            sx={{
              margin: '0 0 0.5rem 0',
            }}
          >
            {optionList.length > 0 && optionsValue.length > 0 && (
              <Box>
                {optionsValue.map((option: any) => (
                  <Typography
                    sx={{
                      fontFamily: 'Lato, sans-serif',
                      fontWeight: 600,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#000000',
                    }}
                    key={option.valueLabel}
                  >
                    {`${option.valueLabel}: ${option.valueText}`}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>

          {productNote && productNote.trim().length > 0 && (
            <Typography
              sx={{
                fontSize: '14px',
                lineHeight: '20px',
                fontFamily: 'Lato, sans-serif',
                fontWeight: 600,
                color: '#ED6C02',
                marginTop: '0.3rem',
                marginBottom: '0.3rem',
              }}
            >
              {productNote}
            </Typography>
          )}

          <Typography
            sx={{
              fontFamily: 'Lato, sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#000000',
            }}
          >
            {b3Lang('shoppingList.shoppingDetailCard.price', {
              price: showPrice(currencyFormat(price), shoppingDetail),
            })}
          </Typography>

          <Box
            sx={{
              margin: '0.5rem 0',
            }}
          >
            <QuantityControlsContainer>
              <QuantityMinusButton
                type="button"
                disabled={isQuantityDisabled || numericQuantity <= 0}
                onClick={() => {
                  const nextValue = numericQuantity - 1;
                  if (nextValue < 0) return;
                  const hasChanged = handleUpdateProductQty(shoppingDetail.id, nextValue);
                  if (hasChanged) {
                    void handleUpdateShoppingListItem(itemId, { force: true });
                  }
                }}
              >
                <MinusSign />
              </QuantityMinusButton>
              <QuantityInput
                type="number"
                disabled={isQuantityDisabled}
                value={quantity}
                onChange={(event) => {
                  handleUpdateProductQty(shoppingDetail.id, event.target.value);
                }}
                onBlur={() => {
                  void handleUpdateShoppingListItem(itemId);
                }}
              />
              <QuantityPlusButton
                type="button"
                disabled={isQuantityDisabled}
                onClick={() => {
                  const nextValue = numericQuantity + 1;
                  const hasChanged = handleUpdateProductQty(shoppingDetail.id, nextValue);
                  if (hasChanged) {
                    void handleUpdateShoppingListItem(itemId, { force: true });
                  }
                }}
              >
                <PlusSign />
              </QuantityPlusButton>
            </QuantityControlsContainer>
          </Box>
          <Typography
            sx={{
              fontFamily: 'Lato, sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#000000',
            }}
          >
            {b3Lang('shoppingList.shoppingDetailCard.total', {
              total: showPrice(currencyFormat(total), shoppingDetail),
            })}
          </Typography>
          <Box
            sx={{
              marginTop: '11px',
              textAlign: 'end',
            }}
            id="shoppingList-actionList-mobile"
          >
            {b2bAndBcShoppingListActionsPermissions && (
              <StickyNote2
                sx={{
                  marginRight: '0.5rem',
                  cursor: 'pointer',
                  color: 'rgba(0, 0, 0, 0.54)',
                }}
                onClick={() => {
                  setAddNoteOpen(true);
                  setAddNoteItemId(Number(itemId));

                  if (productNote) {
                    setNotes(productNote);
                  }
                }}
              />
            )}

            {canChangeOption && (
              <Edit
                sx={{
                  marginRight: canChangeOption ? '0.5rem' : '',
                  marginLeft: canChangeOption ? '0.3rem' : '',
                  cursor: 'pointer',
                  color: 'rgba(0, 0, 0, 0.54)',
                }}
                onClick={() => {
                  onEdit(
                    {
                      ...productsSearch,
                      selectOptions: optionList,
                      quantity,
                    },
                    variantId,
                    itemId,
                  );
                }}
              />
            )}
            {b2bAndBcShoppingListActionsPermissions && !isReadForApprove && (
              <Delete
                sx={{
                  marginLeft: '0.3rem',
                  cursor: 'pointer',
                  color: 'rgba(0, 0, 0, 0.54)',
                }}
                onClick={() => {
                  setDeleteOpen(true);
                  onDelete(Number(itemId));
                }}
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Box>
  );
}

export default ShoppingDetailCard;
