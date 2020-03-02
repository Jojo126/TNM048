// 

d3.json("data/miserables.json", function(error, graph) {
  if (error) throw error;
  
  let innerHTML = '';
  let firstIteration = true;
  let maxWidth,
      amountWidth,
      upWidth,
      downWidth;
  graph.words.forEach(wordObj => {
    
    if(firstIteration)
      {
        maxWidth = wordObj.amount;
        firstIteration = false;
      }
    
    amountWidth = (wordObj.amount / maxWidth) * 100;
    upWidth = wordObj.ups/100 * amountWidth;
    downWidth = wordObj.downs/100 * amountWidth;
    
    innerHTML += '<li><h3 class="word">' + wordObj.word + '</h3><div><h3 class="occurrences">' + wordObj.amount + '</h3><div class="stapel"><span class="ups" style="width: ' + upWidth + '%">' + wordObj.ups + '%</span><span class="downs" style="width: ' + downWidth + '%">' + wordObj.downs + '%</span></div><div></li>';
  });
  
  document.getElementById("wordlist").innerHTML = innerHTML;
});