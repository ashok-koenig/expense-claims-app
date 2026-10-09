const { port } = require('./config');
const app = require('./app');

app.listen(port, () => {
  console.log(`Expense claims app listening on http://localhost:${port}`);
});
