import { PersistPartial } from 'redux-persist/es/persistReducer';
import {
  buildCompanyStateWith,
  builder,
  buildStoreInfoStateWith,
  bulk,
  faker,
  getUnixTime,
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  userEvent,
} from 'tests/test-utils';

import {
  QuoteEdge,
  QuotesListB2B,
  QuotesListBC,
  QuoteStatus,
} from '@/shared/service/b2b/graphql/quote';
import { ShoppingListsCreatedByUser } from '@/shared/service/b2b/graphql/shoppingList';
import { QuoteInfoState } from '@/store/slices/quoteInfo';
import { CompanyStatus, UserTypes } from '@/types';

import QuotesList from './index';

const buildShoppingListsCreatedByUserWith = builder<ShoppingListsCreatedByUser>(() => ({
  data: { createdByUser: { results: { createdBy: [], salesRep: [] } } },
}));

const buildQuoteEdgeWith = builder<QuoteEdge>(() => ({
  node: {
    id: faker.string.uuid(),
    createdAt: getUnixTime(faker.date.past()),
    updatedAt: getUnixTime(faker.date.recent()),
    quoteNumber: faker.number.int().toString(),
    quoteTitle: faker.commerce.productName(),
    referenceNumber: faker.number.int().toString(),
    createdBy: faker.person.fullName(),
    expiredAt: getUnixTime(faker.date.future()),
    discount: faker.commerce.price(),
    grandTotal: faker.commerce.price(),
    currency: {
      token: faker.finance.currencySymbol(),
      location: faker.location.country(),
      currencyCode: faker.finance.currencyCode(),
      decimalToken: faker.string.symbol(),
      decimalPlaces: faker.number.int({ min: 0, max: 100 }),
      thousandsToken: faker.string.symbol(),
      currencyExchangeRate: faker.finance.amount(),
    },
    status: faker.helpers.enumValue(QuoteStatus),
    salesRep: faker.person.fullName(),
    salesRepEmail: faker.internet.email(),
    orderId: faker.string.uuid(),
    subtotal: faker.commerce.price(),
    totalAmount: faker.commerce.price(),
    taxTotal: faker.commerce.price(),
  },
}));

const buildQuotesListB2BWith = builder<QuotesListB2B>(() => {
  const totalCount = faker.number.int({ min: 0, max: 10 });
  const edges = bulk(buildQuoteEdgeWith, 'WHATEVER_VALUES').times(totalCount);

  return { data: { quotes: { totalCount, edges } } };
});

const buildQuotesListBCWith = builder<QuotesListBC>(() => {
  const totalCount = faker.number.int({ min: 0, max: 10 });
  const edges = bulk(buildQuoteEdgeWith, 'WHATEVER_VALUES').times(totalCount);

  return { data: { customerQuotes: { totalCount, edges } } };
});

type QuoteItem = QuoteInfoState['draftQuoteList'][number];

const productSearchItem = builder<QuoteItem['node']['productsSearch']>(() => ({
  id: faker.number.int(),
  name: faker.commerce.productName(),
  sku: faker.string.uuid(),
  base_price: faker.commerce.price(),
  costPrice: faker.commerce.price(),
  channelId: [faker.number.int()],
  selectOptions: faker.commerce.productAdjective(),
  inventoryLevel: faker.number.int(),
  inventoryTracking: faker.helpers.arrayElement(['none', 'product', 'variant']),
  availability: faker.helpers.arrayElement(['in stock', 'out of stock', 'preorder']),
  orderQuantityMinimum: faker.number.int(),
  orderQuantityMaximum: faker.number.int(),
  variants: [],
  currencyCode: faker.finance.currencyCode(),
  imageUrl: faker.image.url(),
  modifiers: [],
  options: [],
  optionsV3: [],
  allOptions: [],
  productUrl: faker.internet.url(),
  quantity: faker.number.int(),
  product_options: [],
}));

const buildDraftQuoteItemWith = builder<QuoteItem>(() => ({
  node: {
    id: faker.string.uuid(),
    productId: faker.number.int(),
    productName: faker.commerce.productName(),
    quantity: faker.number.int({ min: 1, max: 100 }),
    basePrice: faker.number.int(),
    optionList: faker.lorem.word(),
    taxPrice: faker.number.int(),
    calculatedValue: {},
    productsSearch: productSearchItem('WHATEVER_VALUES'),
  },
}));

type Address =
  | QuoteInfoState['draftQuoteInfo']['billingAddress']
  | QuoteInfoState['draftQuoteInfo']['shippingAddress'];

const buildAddressWith = builder<Address>(() => ({
  companyName: faker.company.name(),
  city: faker.location.city(),
  label: faker.lorem.word(),
  state: faker.location.state(),
  address: faker.location.streetAddress(),
  country: faker.location.country(),
  zipCode: faker.location.zipCode(),
  lastName: faker.person.lastName(),
  addressId: faker.number.int(),
  apartment: faker.location.secondaryAddress(),
  firstName: faker.person.firstName(),
  phoneNumber: faker.phone.number(),
  addressLabel: faker.lorem.word(),
}));

const buildQuoteInfoStateWith = builder<QuoteInfoState & PersistPartial>(() => ({
  draftQuoteList: bulk(buildDraftQuoteItemWith, 'WHATEVER_VALUES').times(
    faker.number.int({ min: 1, max: 12 }),
  ),
  draftQuoteInfo: {
    userId: faker.number.int(),
    contactInfo: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      companyName: faker.company.name(),
      phoneNumber: faker.phone.number(),
    },
    shippingAddress: buildAddressWith('WHATEVER_VALUES'),
    billingAddress: buildAddressWith('WHATEVER_VALUES'),
    fileInfo: [],
    note: faker.lorem.sentence(),
    referenceNumber: faker.number.int().toString(),
    extraFields: [],
    recipients: [],
  },
  quoteDetailToCheckoutUrl: faker.internet.url(),
  _persist: { version: 1, rehydrated: true },
}));

const { server } = startMockServer();

beforeEach(() => {
  vi.spyOn(document.body, 'clientWidth', 'get').mockReturnValue(500);
});

const storeInfoWithDateFormat = buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } });

describe('when the user is a B2B customer', () => {
  const approvedB2BCompany = buildCompanyStateWith({
    companyInfo: { status: CompanyStatus.APPROVED },
    customer: { userType: UserTypes.MULTIPLE_B2C, firstName: 'John', lastName: 'Doe' },
  });

  const preloadedState = { company: approvedB2BCompany, storeInfo: storeInfoWithDateFormat };

  it('displays cards listing each key attribute of a quote', async () => {
    const quotesListB2B = buildQuotesListB2BWith({
      data: { quotes: { totalCount: 1, edges: [buildQuoteEdgeWith('WHATEVER_VALUES')] } },
    });

    server.use(
      graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
      graphql.query('GetShoppingListsCreatedByUser', () =>
        HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<QuotesList />, { preloadedState });

    expect(await screen.findByText('Title:')).toBeInTheDocument();
    expect(screen.queryByText('Total:')).not.toBeInTheDocument();
    expect(screen.queryByText('Currency:')).not.toBeInTheDocument();
    expect(screen.getByText('Date created:')).toBeInTheDocument();
    expect(screen.getByText('Expiration date:')).toBeInTheDocument();
  });

  it('displays a card with values for each key attribute of a quote', async () => {
    const manySocks = buildQuoteEdgeWith({
      node: {
        quoteTitle: 'Many Socks',
        createdAt: getUnixTime(new Date('1 January 2025')),
        expiredAt: getUnixTime(new Date('3 March 2025')),
        totalAmount: '101.99',
        currency: {
          token: '$',
          location: 'left',
          decimalToken: '.',
          decimalPlaces: 2,
          currencyCode: 'USD',
        },
        status: QuoteStatus.OPEN,
      },
    });

    const quotesListB2B = buildQuotesListB2BWith({
      data: { quotes: { totalCount: 1, edges: [manySocks] } },
    });

    server.use(
      graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
      graphql.query('GetShoppingListsCreatedByUser', () =>
        HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<QuotesList />, { preloadedState });

    const card = await screen.findByRole('button', { name: /Many Socks/ });

    expect(card).toHaveTextContent(/Open/);
    expect(card).toHaveTextContent(/Title:Many Socks/);
    expect(card).toHaveTextContent(/\$101\.99/);
    expect(card).toHaveTextContent(/USD/);
    expect(card).toHaveTextContent(/Date created:1 January 2025/);
    expect(card).toHaveTextContent(/Expiration date:3 March 2025/);
  });

  it('displays a quote per card', async () => {
    const manySocks = buildQuoteEdgeWith({ node: { quoteTitle: 'Many Socks' } });
    const someTrousers = buildQuoteEdgeWith({ node: { quoteTitle: 'Some Trouser' } });
    const oneShirt = buildQuoteEdgeWith({ node: { quoteTitle: 'One Shirt' } });

    const quotesListB2B = buildQuotesListB2BWith({
      data: { quotes: { totalCount: 3, edges: [manySocks, someTrousers, oneShirt] } },
    });

    server.use(
      graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
      graphql.query('GetShoppingListsCreatedByUser', () =>
        HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<QuotesList />, { preloadedState });

    // loose test as there is no way to target the cards individually
    expect(await screen.findByText('Many Socks')).toBeInTheDocument();
    expect(screen.getByText('Some Trouser')).toBeInTheDocument();
    expect(screen.getByText('One Shirt')).toBeInTheDocument();
  });

  describe('when clicking on a non-draft quote card', () => {
    it('navigates to the respective quote details page, with the created date', async () => {
      const manySocks = buildQuoteEdgeWith({
        node: {
          quoteTitle: 'Many Socks',
          id: '939232',
          createdAt: getUnixTime(new Date('1 January 2025')),
          status: QuoteStatus.OPEN,
        },
      });

      const quotesListB2B = buildQuotesListB2BWith({
        data: { quotes: { totalCount: 1, edges: [manySocks] } },
      });

      server.use(
        graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
        ),
      );

      const { navigation } = renderWithProviders(<QuotesList />, { preloadedState });

      await userEvent.click(await screen.findByRole('button', { name: /Many Socks/ }));

      expect(navigation).toHaveBeenCalledWith(
        `/quoteDetail/939232?date=${getUnixTime(new Date('1 January 2025'))}`,
      );
    });
  });

  describe('when the user has a draft quote', () => {
    it('displays the draft quote details at the top of the list', async () => {
      const someSavedQuote = buildQuoteEdgeWith({ node: { quoteNumber: '123456789' } });
      const quotesListB2B = buildQuotesListB2BWith({
        data: { quotes: { totalCount: 1, edges: [someSavedQuote] } },
      });

      server.use(
        graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
        ),
      );

      const someDraftQuoteItem = buildDraftQuoteItemWith({
        node: { basePrice: 23, taxPrice: 0, quantity: 2 },
      });
      const anotherDraftQuoteItem = buildDraftQuoteItemWith({
        node: { basePrice: 77, taxPrice: 0, quantity: 2 },
      });

      const quoteInfo = buildQuoteInfoStateWith({
        draftQuoteList: [someDraftQuoteItem, anotherDraftQuoteItem],
      });

      renderWithProviders(<QuotesList />, {
        preloadedState: { ...preloadedState, quoteInfo },
      });

      const cards = await screen.findAllByRole('button', { name: /Title:/ });

      expect(cards[0]).toHaveTextContent(/Title:—/);
      expect(cards[1]).toHaveTextContent(/Title:123456789/);

      expect(cards[0]).toHaveTextContent(/Draft/);
      expect(cards[0]).toHaveTextContent(/\$200\.00/);
      expect(cards[0]).toHaveTextContent(/Date created:—/);
      expect(cards[0]).toHaveTextContent(/Expiration date:—/);
    });
  });

  describe('when clicking on the draft quote card', () => {
    // A user can only ever have one draft quote at a time
    it('navigates to the quote draft page', async () => {
      server.use(
        graphql.query('GetQuotesList', () =>
          HttpResponse.json(
            buildQuotesListB2BWith({ data: { quotes: { totalCount: 0, edges: [] } } }),
          ),
        ),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
        ),
      );

      const quoteInfo = buildQuoteInfoStateWith({
        draftQuoteList: [buildDraftQuoteItemWith('WHATEVER_VALUES')],
      });

      const { navigation } = renderWithProviders(<QuotesList />, {
        preloadedState: { ...preloadedState, quoteInfo },
      });

      await userEvent.click(await screen.findByRole('button', { name: /Draft/ }));

      expect(navigation).toHaveBeenCalledWith('/quoteDraft');
    });
  });

  it.each([
    { status: QuoteStatus.OPEN, expectedLabel: 'Open' },
    { status: QuoteStatus.ORDERED, expectedLabel: 'Ordered' },
    { status: QuoteStatus.EXPIRED, expectedLabel: 'Expired' },
  ])("displays a quote's status as $expectedLabel", async ({ status, expectedLabel }) => {
    const someQuote = buildQuoteEdgeWith({ node: { status } });

    const quotesListB2B = buildQuotesListB2BWith({
      data: { quotes: { totalCount: 4, edges: [someQuote] } },
    });

    server.use(
      graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
      graphql.query('GetShoppingListsCreatedByUser', () =>
        HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<QuotesList />, { preloadedState });

    expect(await screen.findByText(expectedLabel)).toBeInTheDocument();
  });

  describe('when the user has no quotes', () => {
    it('displays a message of "No data"', async () => {
      const quotesListB2B = buildQuotesListB2BWith({
        data: { quotes: { totalCount: 0, edges: [] } },
      });

      server.use(
        graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json(buildShoppingListsCreatedByUserWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<QuotesList />, { preloadedState });

      expect(await screen.findByText('No data')).toBeInTheDocument();
    });
  });
});

describe('when the user is a B2C customer', () => {
  const nonCompany = buildCompanyStateWith({ customer: { b2bId: undefined } });

  const preloadedState = { company: nonCompany, storeInfo: storeInfoWithDateFormat };

  it('displays cards listing each key attribute of a quote', async () => {
    const quotesListB2B = buildQuotesListBCWith({
      data: { customerQuotes: { totalCount: 1, edges: [buildQuoteEdgeWith('WHATEVER_VALUES')] } },
    });

    server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)));

    renderWithProviders(<QuotesList />, { preloadedState });

    expect(await screen.findByText('Title:')).toBeInTheDocument();
    expect(screen.queryByText('Total:')).not.toBeInTheDocument();
    expect(screen.queryByText('Currency:')).not.toBeInTheDocument();
    expect(screen.getByText('Date created:')).toBeInTheDocument();
    expect(screen.getByText('Expiration date:')).toBeInTheDocument();
  });

  it('displays a card with values for each key attribute of a quote', async () => {
    const manySocks = buildQuoteEdgeWith({
      node: {
        quoteTitle: 'Many Socks',
        createdAt: getUnixTime(new Date('1 January 2025')),
        expiredAt: getUnixTime(new Date('3 March 2025')),
        totalAmount: '101.99',
        currency: {
          token: '$',
          location: 'left',
          decimalToken: '.',
          decimalPlaces: 2,
          currencyCode: 'USD',
        },
        status: QuoteStatus.OPEN,
      },
    });

    const quotesListB2B = buildQuotesListBCWith({
      data: { customerQuotes: { totalCount: 1, edges: [manySocks] } },
    });

    server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)));

    renderWithProviders(<QuotesList />, { preloadedState });

    const card = await screen.findByRole('button', { name: /Many Socks/ });

    expect(card).toHaveTextContent(/Open/);
    expect(card).toHaveTextContent(/Title:Many Socks/);
    expect(card).toHaveTextContent(/\$101\.99/);
    expect(card).toHaveTextContent(/USD/);
    expect(card).toHaveTextContent(/Date created:1 January 2025/);
    expect(card).toHaveTextContent(/Expiration date:3 March 2025/);
  });

  it('displays a quote per card', async () => {
    const manySocks = buildQuoteEdgeWith({ node: { quoteTitle: 'Many Socks' } });
    const someTrousers = buildQuoteEdgeWith({ node: { quoteTitle: 'Some Trouser' } });
    const oneShirt = buildQuoteEdgeWith({ node: { quoteTitle: 'One Shirt' } });

    const quotesListB2B = buildQuotesListBCWith({
      data: { customerQuotes: { totalCount: 3, edges: [manySocks, someTrousers, oneShirt] } },
    });

    server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)));

    renderWithProviders(<QuotesList />, { preloadedState });

    // loose test as there is no way to target the cards individually
    expect(await screen.findByText('Many Socks')).toBeInTheDocument();
    expect(screen.getByText('Some Trouser')).toBeInTheDocument();
    expect(screen.getByText('One Shirt')).toBeInTheDocument();
  });

  describe('when clicking on a non-draft quote card', () => {
    it('navigates to the respective quote details page, with the created date', async () => {
      const manySocks = buildQuoteEdgeWith({
        node: {
          quoteTitle: 'Many Socks',
          id: '939232',
          createdAt: getUnixTime(new Date('1 January 2025')),
          status: QuoteStatus.OPEN,
        },
      });

      const quotesListB2B = buildQuotesListBCWith({
        data: { customerQuotes: { totalCount: 1, edges: [manySocks] } },
      });

      server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)));

      const { navigation } = renderWithProviders(<QuotesList />, { preloadedState });

      await userEvent.click(await screen.findByRole('button', { name: /Many Socks/ }));

      expect(navigation).toHaveBeenCalledWith(
        `/quoteDetail/939232?date=${getUnixTime(new Date('1 January 2025'))}`,
      );
    });
  });

  it.each([
    { status: QuoteStatus.OPEN, expectedLabel: 'Open' },
    { status: QuoteStatus.ORDERED, expectedLabel: 'Ordered' },
    { status: QuoteStatus.EXPIRED, expectedLabel: 'Expired' },
  ])("displays a quote's status as $expectedLabel", async ({ status, expectedLabel }) => {
    const someQuote = buildQuoteEdgeWith({ node: { status } });

    const quotesListB2B = buildQuotesListBCWith({
      data: { customerQuotes: { totalCount: 4, edges: [someQuote] } },
    });

    server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)));

    renderWithProviders(<QuotesList />, { preloadedState });

    expect(await screen.findByText(expectedLabel)).toBeInTheDocument();
  });

  describe('when the user has no quotes', () => {
    it('displays a message of "No data"', async () => {
      const quotesListB2B = buildQuotesListBCWith({
        data: { customerQuotes: { totalCount: 0, edges: [] } },
      });

      server.use(graphql.query('GetQuotesList', () => HttpResponse.json(quotesListB2B)));

      renderWithProviders(<QuotesList />, { preloadedState });

      expect(await screen.findByText('No data')).toBeInTheDocument();
    });
  });
});
