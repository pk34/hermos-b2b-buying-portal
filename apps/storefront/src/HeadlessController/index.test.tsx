import {
  buildCompanyStateWith,
  builder,
  faker,
  graphql,
  HttpResponse,
  renderWithProviders,
  startMockServer,
  stringContainingAll,
} from 'tests/test-utils';
import { when } from 'vitest-when';

import { ShoppingListsItemsProps } from '@/pages/ShoppingLists/config';
import { createQuote } from '@/shared/service/b2b';
import { CustomerRole } from '@/types';
import { CreateQuoteResponse } from '@/types/quotes';

import HeadlessController from '.';

vi.mock('@/shared/service/b2b', async () => {
  const actual = await vi.importActual<typeof import('@/shared/service/b2b')>('@/shared/service/b2b');

  return {
    ...actual,
    createQuote: vi.fn(),
  };
});

const { server } = startMockServer();

const buildShoppingListsNodeWith = builder<{ node: ShoppingListsItemsProps }>(() => ({
  node: {
    id: faker.number.int({ max: 1000 }),
    name: faker.word.words({ count: 1 }),
    description: faker.word.words(),
    status: faker.number.int({ multipleOf: 10, max: 50 }),
    channelId: faker.number.int(),
    customerInfo: {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      userId: faker.number.int(),
      email: faker.internet.email(),
      role: faker.word.words(),
    },
    products: {
      totalCount: faker.number.int(),
    },
    updatedAt: faker.date.anytime().toString(),
    approvedFlag: faker.datatype.boolean(),
    isOwner: faker.datatype.boolean(),
    companyInfo: {
      companyId: faker.number.int().toString(),
      companyName: faker.company.name(),
      companyAddress: faker.location.streetAddress(),
      companyCountry: faker.location.country(),
      companyState: faker.location.state(),
      companyCity: faker.location.city(),
      companyZipCode: faker.location.zipCode(),
      phoneNumber: faker.number.int().toString(),
      bcId: faker.number.int().toString(),
    },
  },
}));

describe('HeadlessController shopping lists utils', () => {
  it('getLists retrieves B2B shopping lists', async () => {
    const getShoppingLists = vi.fn();

    when(getShoppingLists)
      .calledWith(stringContainingAll('first: 50', 'offset: 0'))
      .thenReturn({
        data: {
          shoppingLists: {
            totalCount: 1,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
            },
            edges: [
              buildShoppingListsNodeWith({
                node: {
                  id: 123,
                },
              }),
            ],
          },
        },
      });

    server.use(
      graphql.query('B2BCustomerShoppingLists', ({ query }) =>
        HttpResponse.json(getShoppingLists(query)),
      ),
    );

    const mockSetOpenPage = vi.fn();
    renderWithProviders(<HeadlessController setOpenPage={mockSetOpenPage} />, {
      preloadedState: {
        company: buildCompanyStateWith({
          customer: {
            role: CustomerRole.SUPER_ADMIN,
          },
        }),
      },
    });

    const data = await window.b2b.utils.shoppingList.getLists();

    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 123,
        }),
      ]),
    );
  });

  it('getLists retrieves B2C shopping lists', async () => {
    const getShoppingLists = vi.fn();

    when(getShoppingLists)
      .calledWith(stringContainingAll('first: 50', 'offset: 0'))
      .thenReturn({
        data: {
          customerShoppingLists: {
            totalCount: 1,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
            },
            edges: [
              buildShoppingListsNodeWith({
                node: {
                  id: 123,
                },
              }),
            ],
          },
        },
      });

    server.use(
      graphql.query('CustomerShoppingLists', ({ query }) =>
        HttpResponse.json(getShoppingLists(query)),
      ),
    );

    const mockSetOpenPage = vi.fn();
    renderWithProviders(<HeadlessController setOpenPage={mockSetOpenPage} />);
    const data = await window.b2b.utils.shoppingList.getLists();

    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 123,
        }),
      ]),
    );
  });
});

const buildQuotePayload = () => ({
  message: faker.lorem.sentence(),
  legalTerms: faker.lorem.sentences(),
  totalAmount: '100.00',
  grandTotal: '100.00',
  subtotal: '90.00',
  taxTotal: '10.00',
  discount: '0.00',
  quoteTitle: faker.lorem.words(),
  currency: {
    currencyExchangeRate: '1',
    token: '$',
    location: 'prefix',
    decimalToken: '.',
    decimalPlaces: 2,
    thousandsToken: ',',
    currencyCode: 'USD',
  },
  shippingAddress: {
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zipCode: faker.location.zipCode(),
    country: faker.location.country(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    phoneNumber: faker.phone.number(),
  },
  billingAddress: {
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zipCode: faker.location.zipCode(),
    country: faker.location.country(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    phoneNumber: faker.phone.number(),
  },
  contactInfo: {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    companyName: faker.company.name(),
    phoneNumber: faker.phone.number(),
  },
  productList: [],
  fileList: [],
});

describe('HeadlessController quote utils', () => {
  const quoteCreateResponse: CreateQuoteResponse = {
    data: {
      quoteCreate: {
        quote: { id: faker.number.int(), createdAt: faker.date.recent().toISOString() },
      },
    },
  };

  it('creates a quote with default storefront context when invoked from the theme', async () => {
    const createQuoteMock = vi.mocked(createQuote);
    const quoteData = buildQuotePayload();
    const customerEmail = faker.internet.email();

    createQuoteMock.mockResolvedValue(quoteCreateResponse as any);

    const mockSetOpenPage = vi.fn();
    renderWithProviders(<HeadlessController setOpenPage={mockSetOpenPage} />, {
      preloadedState: {
        company: buildCompanyStateWith({
          customer: { id: faker.number.int({ min: 1 }), emailAddress: customerEmail },
          tokens: { B2BToken: faker.string.uuid(), bcGraphqlToken: '', currentCustomerJWT: '' },
        }),
      },
    });

    const onQuoteCreate = vi.fn();
    window.b2b.callbacks.addEventListener('on-quote-create', onQuoteCreate);

    const response = await window.b2b.utils.quote.create(quoteData);

    expect(onQuoteCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          storeHash: 'store-hash',
          channelId: 1,
          userEmail: customerEmail,
        }),
      }),
    );
    expect(createQuoteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ...quoteData,
        storeHash: 'store-hash',
        channelId: 1,
        userEmail: customerEmail,
      }),
    );
    expect(response).toEqual(quoteCreateResponse);
  });

  it('prevents quote creation when a callback cancels the event', async () => {
    const createQuoteMock = vi.mocked(createQuote);
    const quoteData = buildQuotePayload();

    createQuoteMock.mockResolvedValue(quoteCreateResponse as any);

    const mockSetOpenPage = vi.fn();
    renderWithProviders(<HeadlessController setOpenPage={mockSetOpenPage} />, {
      preloadedState: {
        company: buildCompanyStateWith({
          customer: { id: faker.number.int({ min: 1 }), emailAddress: faker.internet.email() },
          tokens: { B2BToken: faker.string.uuid(), bcGraphqlToken: '', currentCustomerJWT: '' },
        }),
      },
    });

    window.b2b.callbacks.addEventListener('on-quote-create', ({ preventDefault }) => {
      preventDefault();
    });

    await expect(window.b2b.utils.quote.create(quoteData)).rejects.toThrow(
      'Quote creation was prevented by a callback.',
    );
    expect(createQuoteMock).not.toHaveBeenCalled();
  });
});
