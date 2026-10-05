/**
 * Cadastro de cliente exige endereço completo (incluindo CEP).
 * Os testes de integração antigos montavam só nome e telefone.
 * Estes valores são de teste; o CEP é um CEP real de São Paulo só para formato.
 */
export const TEST_CUSTOMER_ADDRESS = {
  postalCode: '01310-100',
  street: 'Avenida Paulista',
  number: '1000',
  district: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  country: 'Brasil',
};

/** CPF válido de teste (não é de pessoa real). */
export const TEST_CUSTOMER_CPF = '529.982.247-25';

export function withCustomerAddress(overrides = {}) {
  return {
    ...TEST_CUSTOMER_ADDRESS,
    ...overrides,
  };
}
