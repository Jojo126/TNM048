d3.json("data/miserables.json", function(error, graph) {
  if (error) throw error;
  
  let innerHTML = '';
  graph.words.forEach(wordObj => {innerHTML += '<li>' + wordObj.word + '</li>'});
  
  document.getElementById("wordlist").innerHTML = innerHTML;
});