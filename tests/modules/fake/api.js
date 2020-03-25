module.exports = function fakeModule() {
  this.addAsync('fake', function test() {
    return 'ok';
  });
};
