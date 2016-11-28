'use strict';
module.exports = function(s){
  var hash = 0,
    i, char;
  if (s === null || s === undefined) throw new Error('string to be hashed must exist');
  if (s.length === 0) return hash;
  for (i = 0; i < s.length; i++) {
    char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};