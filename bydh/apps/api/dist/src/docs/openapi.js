export const openApiDocument = {
    openapi: '3.0.3',
    info: {
        title: 'BYDH API',
        version: '1.0.0',
        description: 'API documentation for authentication, dashboard, and finance flows.',
    },
    servers: [
        {
            url: '/api',
            description: 'API base path',
        },
    ],
    tags: [
        { name: 'health' },
        { name: 'auth' },
        { name: 'build' },
        { name: 'profiles' },
        { name: 'finances' },
        { name: 'scenarios' },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            Message: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                },
            },
        },
    },
    paths: {
        '/health': {
            get: {
                tags: ['health'],
                summary: 'Health check',
                responses: {
                    200: {
                        description: 'Service is healthy',
                    },
                },
            },
        },
        '/auth/register': {
            post: {
                tags: ['auth'],
                summary: 'Register a new user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'email', 'password'],
                                properties: {
                                    name: { type: 'string' },
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string', minLength: 8 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'User created' },
                    400: { description: 'Invalid payload' },
                    409: { description: 'Email already in use' },
                },
            },
        },
        '/auth/login': {
            post: {
                tags: ['auth'],
                summary: 'Login with email and password',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Authenticated' },
                    400: { description: 'Missing credentials' },
                    401: { description: 'Invalid credentials' },
                },
            },
        },
        '/auth/me': {
            get: {
                tags: ['auth'],
                summary: 'Get current user',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Current user info' },
                    401: { description: 'Unauthorized' },
                },
            },
        },
        '/build': {
            get: {
                tags: ['build'],
                summary: 'List house types with grouped build cost items',
                responses: {
                    200: { description: 'Build data' },
                },
            },
        },
        '/build/types': {
            post: {
                tags: ['build'],
                summary: 'Create a house type',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['label'],
                                properties: {
                                    label: { type: 'string' },
                                    description: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'House type created' },
                    400: { description: 'Invalid payload' },
                    409: { description: 'House type already exists' },
                },
            },
        },
        '/build/items': {
            post: {
                tags: ['build'],
                summary: 'Create a build cost item',
                responses: {
                    201: { description: 'Build item created' },
                    400: { description: 'Invalid payload' },
                },
            },
        },
        '/build/items/{id}': {
            patch: {
                tags: ['build'],
                summary: 'Update a build cost item',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Build item updated' },
                    404: { description: 'Build item not found' },
                },
            },
            delete: {
                tags: ['build'],
                summary: 'Delete a build cost item',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    204: { description: 'Build item deleted' },
                },
            },
        },
        '/profiles': {
            get: {
                tags: ['profiles'],
                summary: 'List family profiles for current user',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Profiles list' },
                    401: { description: 'Unauthorized' },
                },
            },
            post: {
                tags: ['profiles'],
                summary: 'Create a family profile',
                security: [{ bearerAuth: [] }],
                responses: {
                    201: { description: 'Profile created' },
                    400: { description: 'Invalid payload' },
                    401: { description: 'Unauthorized' },
                },
            },
        },
        '/finances': {
            get: {
                tags: ['finances'],
                summary: 'Get finances for a family profile',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'profileId',
                        in: 'query',
                        required: false,
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    200: { description: 'Finance data' },
                    401: { description: 'Unauthorized' },
                    404: { description: 'Family profile not found' },
                },
            },
        },
        '/finances/income-types': {
            get: {
                tags: ['finances'],
                summary: 'List income types',
                responses: {
                    200: { description: 'Income types list' },
                },
            },
            post: {
                tags: ['finances'],
                summary: 'Create an income type',
                responses: {
                    201: { description: 'Income type created' },
                    400: { description: 'Invalid payload' },
                    409: { description: 'Income type already exists' },
                },
            },
        },
        '/finances/income-types/{id}': {
            patch: {
                tags: ['finances'],
                summary: 'Update an income type',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Income type updated' },
                    400: { description: 'Invalid payload' },
                    404: { description: 'Income type not found' },
                    409: { description: 'Income type already exists' },
                },
            },
            delete: {
                tags: ['finances'],
                summary: 'Delete an income type',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    204: { description: 'Income type deleted' },
                    400: { description: 'Type is in use' },
                    404: { description: 'Income type not found' },
                },
            },
        },
        '/finances/expense-types': {
            post: {
                tags: ['finances'],
                summary: 'Create an expense type',
                responses: {
                    201: { description: 'Expense type created' },
                    400: { description: 'Invalid payload' },
                    409: { description: 'Expense type already exists' },
                },
            },
        },
        '/finances/expense-types/{id}': {
            patch: {
                tags: ['finances'],
                summary: 'Update an expense type',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Expense type updated' },
                    400: { description: 'Invalid payload' },
                    404: { description: 'Expense type not found' },
                    409: { description: 'Expense type already exists' },
                },
            },
            delete: {
                tags: ['finances'],
                summary: 'Delete an expense type',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    204: { description: 'Expense type deleted' },
                    400: { description: 'Type is in use' },
                    404: { description: 'Expense type not found' },
                },
            },
        },
        '/finances/incomes': {
            post: {
                tags: ['finances'],
                summary: 'Create an income source',
                security: [{ bearerAuth: [] }],
                responses: {
                    201: { description: 'Income source created' },
                    400: { description: 'Invalid payload' },
                    401: { description: 'Unauthorized' },
                    404: { description: 'Family profile not found' },
                },
            },
        },
        '/finances/incomes/{id}': {
            patch: {
                tags: ['finances'],
                summary: 'Update an income source',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Income source updated' },
                    400: { description: 'Invalid payload' },
                    401: { description: 'Unauthorized' },
                    404: { description: 'Income source not found' },
                },
            },
            delete: {
                tags: ['finances'],
                summary: 'Delete an income source',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    204: { description: 'Income source deleted' },
                    401: { description: 'Unauthorized' },
                    404: { description: 'Income source not found' },
                },
            },
        },
        '/finances/investments': {
            post: {
                tags: ['finances'],
                summary: 'Create an investment',
                security: [{ bearerAuth: [] }],
                responses: {
                    201: { description: 'Investment created' },
                    400: { description: 'Invalid payload' },
                    401: { description: 'Unauthorized' },
                    404: { description: 'Family profile not found' },
                },
            },
        },
        '/finances/investments/{id}': {
            patch: {
                tags: ['finances'],
                summary: 'Update an investment',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Investment updated' },
                    401: { description: 'Unauthorized' },
                    404: { description: 'Investment not found' },
                },
            },
            delete: {
                tags: ['finances'],
                summary: 'Delete an investment',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    204: { description: 'Investment deleted' },
                    401: { description: 'Unauthorized' },
                    404: { description: 'Investment not found' },
                },
            },
        },
        '/finances/expenses': {
            post: {
                tags: ['finances'],
                summary: 'Create an expense',
                security: [{ bearerAuth: [] }],
                responses: {
                    201: { description: 'Expense created' },
                    400: { description: 'Invalid payload' },
                    401: { description: 'Unauthorized' },
                    404: { description: 'Family profile not found' },
                },
            },
        },
        '/finances/expenses/{id}': {
            patch: {
                tags: ['finances'],
                summary: 'Update an expense',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Expense updated' },
                    401: { description: 'Unauthorized' },
                    404: { description: 'Expense not found' },
                },
            },
            delete: {
                tags: ['finances'],
                summary: 'Delete an expense',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    204: { description: 'Expense deleted' },
                    401: { description: 'Unauthorized' },
                    404: { description: 'Expense not found' },
                },
            },
        },
        '/scenarios': {
            get: {
                tags: ['scenarios'],
                summary: 'List scenarios for family profile',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'profileId',
                        in: 'query',
                        required: false,
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    200: { description: 'Scenarios list' },
                    401: { description: 'Unauthorized' },
                },
            },
        },
    },
};
