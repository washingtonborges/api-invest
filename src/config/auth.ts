export default {
  jwt: {
    secret:
      process.env.JWT_SECRET == null
        ? 'ERROR: Load .env'
        : process.env.JWT_SECRET,
    expiresIn: '1d'
  }
};
