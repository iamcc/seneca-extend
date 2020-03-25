module.exports = {
  init: () => Promise.resolve(),
  seneca() {
    this.addAsync('fake', function async() {
      return 'async';
    });
  },
};
