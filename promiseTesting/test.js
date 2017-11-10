/*
function dieToss() {
  return Math.floor(Math.random() * 6) + 1;
}

console.log('1');
var promise = new RSVP.Promise(function(fulfill, reject) {
  var n = dieToss();
  if (n === 6) {
    fulfill(n);
  } else {
    reject(n);
  }
  console.log('2');
});

promise.then(function(toss) {
  console.log('Yay, threw a ' + toss + '.');  
}, function(toss) {
  console.log('Oh, noes, threw a ' + toss + '.');  
});
console.log('3');
*/


function printThis(){
	console.log('this 27');
	return true;
}
console.log('globalscope happens first');
var promise = new RSVP.Promise(function(fulfill,reject){
	var thisthis = printThis();
	if(thisthis) fulfill(thisthis);
	else reject(thisthis);
});

promise.then(function(toss){
	console.log('that 38');
})