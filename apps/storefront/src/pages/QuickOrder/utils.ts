import { LangFormatFunction } from '@/lib/lang';
import { searchProducts } from '@/shared/service/b2b';
import { getCart } from '@/shared/service/bc/graphql/cart';
import { store } from '@/store';
import { OrderedProductType, ProductInfoType } from '@/types/gql/graphql';
import { snackbar } from '@/utils';
import { getProductPriceIncTaxOrExTaxBySetting } from '@/utils/b3Product/b3Product';
import { conversionProductsList } from '@/utils/b3Product/shared/config';
import { LineItem } from '@/utils/b3Product/b3Product';

export interface QuickOrderOptionItem {
  id?: number | string;
  option_id: number;
  order_product_id?: number;
  product_option_id: number;
  display_name: string;
  display_name_customer: string;
  display_name_merchant: string;
  display_value: string;
  display_value_customer: string;
  display_value_merchant: string;
  value: string;
  type?: string;
  name?: string;
  display_style?: string;
}

export interface QuickOrderTableNode extends OrderedProductType {
  productsSearch: ProductInfoType;
  quantity: number;
  optionList: QuickOrderOptionItem[];
  primaryImage?: string;
  itemId?: number;
  basePrice?: number | string;
  discount?: number | string;
  tax?: number | string;
  enteredInclusive?: boolean;
}

export interface QuickOrderListItem {
  node: QuickOrderTableNode;
}

interface ProductInfo extends OrderedProductType {
  productsSearch: ProductInfoType;
  quantity: number;
}

interface CommonProducts extends ProductInfoType {
  quantity: number;
  variantId?: string;
}

export interface CheckedProduct {
  node: ProductInfo;
}

export interface QuickOrderSelection {
  productId: number;
  variantId: number;
  variantSku: string;
  quantity: number;
  optionSelections?: { optionId: number | string; optionValue: string | number | null }[];
}

const handleVerifyProduct = (products: CustomFieldItems, b3Lang: LangFormatFunction) => {
  const {
    variantId,
    variants,
    inventoryLevel,
    inventoryTracking,
    orderQuantityMaximum,
    orderQuantityMinimum,
    quantity,
    sku,
  } = products;

  const isEnableProduct =
    store.getState().global?.blockPendingQuoteNonPurchasableOOS?.isEnableProduct || false;

  const isStock = inventoryTracking !== 'none';
  let purchasingDisabled = false;
  let stock = inventoryLevel;
  let productSku = sku;

  const currentVariant = variants.find(
    (variant: CustomFieldItems) => Number(variant.variant_id) === Number(variantId),
  );
  if (currentVariant) {
    purchasingDisabled = currentVariant.purchasing_disabled;
    stock = inventoryTracking === 'variant' ? currentVariant.inventory_level : stock;
    productSku = currentVariant.sku || sku;
  }

  if (purchasingDisabled && !isEnableProduct) {
    snackbar.error(
      b3Lang('purchasedProducts.quickOrderPad.notPurchaseableSku', {
        notPurchaseSku: productSku,
      }),
    );

    return {
      isVerify: false,
      type: 'notPurchaseableSku',
    };
  }

  if (isStock && Number(quantity) > Number(stock)) {
    snackbar.error(
      b3Lang('purchasedProducts.quickOrderPad.insufficientStockSku', {
        sku: productSku,
      }),
    );

    return {
      isVerify: false,
      type: 'insufficientStockSku',
    };
  }

  if (Number(orderQuantityMinimum) > 0 && Number(quantity) < orderQuantityMinimum) {
    snackbar.error(
      b3Lang('purchasedProducts.quickOrderPad.minQuantityMessage', {
        minQuantity: orderQuantityMinimum,
        sku: productSku,
      }),
    );

    return {
      isVerify: false,
      type: 'minQuantity',
    };
  }

  if (Number(orderQuantityMaximum) > 0 && Number(quantity) > Number(orderQuantityMaximum)) {
    snackbar.error(
      b3Lang('purchasedProducts.quickOrderPad.maxQuantityMessage', {
        maxQuantity: orderQuantityMaximum,
        sku: productSku,
      }),
    );

    return {
      isVerify: false,
      type: 'maxQuantity',
    };
  }

  return {
    isVerify: true,
  };
};

export const getCartProductInfo = async () => {
  const {
    data: {
      site: { cart },
    },
  } = await getCart();

  if (cart) {
    const { lineItems } = cart;
    return Object.values(lineItems).reduce((pre, lineItems) => {
      lineItems.forEach((item: LineItem) => {
        pre.push(item);
      });

      return pre;
    }, [] as LineItem[]);
  }

  return [];
};

export const addCartProductToVerify = async (
  checkedArr: Partial<CheckedProduct>[],
  b3lang: LangFormatFunction,
) => {
  const cartProducts: LineItem[] = await getCartProductInfo();

  const addCommonProducts = checkedArr.reduce((pre, checkItem) => {
    const { node } = checkItem;

    const num =
      cartProducts.find(
        (item: LineItem) =>
          item.sku === node?.sku &&
          Number(item?.variantEntityId || 0) === Number(node?.variantId || 0),
      )?.quantity || 0;

    pre.push({
      ...node?.productsSearch,
      variantId: node?.variantId,
      quantity: (node?.quantity || 0) + num,
    });

    return pre;
  }, [] as CommonProducts[]);

  return addCommonProducts.every((product) => {
    return handleVerifyProduct(product, b3lang).isVerify;
  });
};

const extractOptionId = (optionId: number | string) => {
  if (typeof optionId === 'string') {
    const match = optionId.match(/\[(\d+)\]/);
    if (match && match[1]) return Number(match[1]);
    const numeric = Number(optionId);
    if (!Number.isNaN(numeric)) return numeric;
  }

  return Number(optionId);
};

const buildOptionList = (
  selections: QuickOrderSelection['optionSelections'] = [],
  productInfo: ProductInfoType,
): QuickOrderOptionItem[] => {
  if (!selections.length) return [];

  const { modifiers = [], optionsV3 = [], options = [] } = productInfo;
  const allOptions: CustomFieldItems[] = [
    ...(optionsV3 as CustomFieldItems[]),
    ...(modifiers as CustomFieldItems[]),
    ...(options as CustomFieldItems[]),
  ];

  return selections.map(({ optionId, optionValue }) => {
    const normalizedId = extractOptionId(optionId);
    const optionItem = allOptions.find((item) => Number(item.id) === normalizedId);
    let displayValue = '';

    if (optionItem?.option_values?.length) {
      const valueItem = optionItem.option_values.find(
        (value: CustomFieldItems) => String(value.id) === String(optionValue),
      );
      displayValue = valueItem?.label || '';
    }

    if (!displayValue) {
      if (optionValue && typeof optionValue === 'object') {
        displayValue = JSON.stringify(optionValue);
      } else {
        displayValue = optionValue !== null && optionValue !== undefined ? String(optionValue) : '';
      }
    }

    const name = optionItem?.display_name || optionItem?.name || '';

    return {
      option_id: normalizedId,
      product_option_id: normalizedId,
      display_name: name,
      display_name_customer: name,
      display_name_merchant: name,
      display_value: displayValue,
      display_value_customer: displayValue,
      display_value_merchant: displayValue,
      value:
        optionValue && typeof optionValue === 'object'
          ? JSON.stringify(optionValue)
          : optionValue !== null && optionValue !== undefined
            ? String(optionValue)
            : '',
      type: optionItem?.type || '',
      name,
      display_style: optionItem?.display_style || '',
      order_product_id: 0,
    };
  });
};

interface BuildQuickOrderItemsParams {
  companyId: number;
  customerGroupId?: number;
  currencyCode?: string;
}

export const buildQuickOrderItemsFromSelections = async (
  selections: QuickOrderSelection[],
  { companyId, customerGroupId, currencyCode }: BuildQuickOrderItemsParams,
): Promise<QuickOrderListItem[]> => {
  if (!selections.length) return [];

  const productIds = Array.from(new Set(selections.map((item) => item.productId)));

  const { productsSearch } = await searchProducts({
    productIds,
    companyId,
    customerGroupId,
    currencyCode,
  });

  const convertedProducts = conversionProductsList(productsSearch || []);

  const timestamp = Math.floor(Date.now() / 1000);

  return selections.reduce<QuickOrderListItem[]>((acc, selection, index) => {
    const productInfo = convertedProducts.find(
      (product: CustomFieldItems) => Number(product.id) === Number(selection.productId),
    );

    if (!productInfo) return acc;

    const variants = productInfo.variants || [];
    const matchedVariant = variants.find(
      (variant: CustomFieldItems) => Number(variant.variant_id) === Number(selection.variantId),
    );

    const variantSku = selection.variantSku || matchedVariant?.sku || productInfo.sku || '';

    const optionList = buildOptionList(selection.optionSelections, productInfo);

    const unitPrice =
      getProductPriceIncTaxOrExTaxBySetting(variants, Number(selection.variantId)) ||
      Number(matchedVariant?.calculated_price || productInfo.price_inc_tax || 0);

    const taxInclusive = matchedVariant?.bc_calculated_price?.entered_inclusive ?? false;
    const taxValue = matchedVariant?.bc_calculated_price
      ? matchedVariant.bc_calculated_price.tax_inclusive - matchedVariant.bc_calculated_price.tax_exclusive
      : 0;

    acc.push({
      node: {
        id: `manual-${selection.productId}-${selection.variantId}-${timestamp}-${index}`,
        createdAt: timestamp,
        updatedAt: timestamp,
        productName: productInfo.name,
        productBrandName: productInfo.brandName || '',
        variantSku,
        productId: String(selection.productId),
        variantId: String(selection.variantId),
        optionList,
        orderedTimes: '0',
        firstOrderedAt: timestamp,
        lastOrderedAt: timestamp,
        lastOrderedItems: String(selection.quantity),
        sku: productInfo.sku,
        lastOrdered: String(timestamp),
        imageUrl: matchedVariant?.image_url || productInfo.imageUrl,
        baseSku: productInfo.sku,
        basePrice: unitPrice?.toString() || '0',
        discount: '0',
        tax: taxValue?.toString() || '0',
        enteredInclusive: taxInclusive,
        productUrl: productInfo.productUrl,
        optionSelections: [],
        quantity: Number(selection.quantity),
        productsSearch: productInfo,
        primaryImage: matchedVariant?.image_url || productInfo.imageUrl,
        itemId: Number(selection.variantId),
      },
    });

    return acc;
  }, []);
};
