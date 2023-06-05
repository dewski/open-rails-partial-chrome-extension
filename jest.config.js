module.exports = {
  testEnvironment: "jsdom",
  roots: ["src"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
};
