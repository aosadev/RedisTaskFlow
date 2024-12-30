const mockData = { keys: {} };

module.exports = {
  createClient: () => ({
    connect: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    get: jest.fn((key) => Promise.resolve(mockData.keys[key] || null)),
    set: jest.fn((key, value) => {
      mockData.keys[key] = value;
      return Promise.resolve();
    }),
    incr: jest.fn((counterKey) => {
      let val = parseInt(mockData.keys[counterKey] || '0', 10);
      val++;
      mockData.keys[counterKey] = val.toString();
      return Promise.resolve(val);
    }),
    hSet: jest.fn((key, data) => {
      if (!mockData.keys[key]) mockData.keys[key] = { ___hash: {} };
      const hash = mockData.keys[key].___hash || {};
      for (const [field, value] of Object.entries(data)) {
        hash[field] = value;
      }
      mockData.keys[key].___hash = hash;
      return Promise.resolve();
    }),
    hGetAll: jest.fn((key) => {
      if (mockData.keys[key] && mockData.keys[key].___hash) {
        return Promise.resolve(mockData.keys[key].___hash);
      }
      return Promise.resolve({});
    }),
    del: jest.fn((key) => {
      delete mockData.keys[key];
      return Promise.resolve();
    })
  })
};
