// const nanoRPC = jest.createMockFromModule('../getNanoPrice');

export async function getNanoPrice(
  currency: string,
  date: string
): Promise<Error | number> {
  return new Promise((resolve, reject) => {
    return resolve(9.8);
  });
}

export async function getCurrentNanoPrice(
  currency: string
): Promise<Error | number> {
  return new Promise((resolve, reject) => {
    return resolve(9.8);
  });
}
