d3.json("miserables.json", function(error, graph) {
  if (error) throw error;
  
  //console.log(graph.words);
  let innerHTML = '';
  graph.words.forEach(wordObj => {innerHTML += '<li>' + wordObj.word + '</li>'});
  //console.log(innerHTML);
  
  //console.log(document.getElementById("wordlist"));
  document.getElementById("wordlist").innerHTML = innerHTML;
});