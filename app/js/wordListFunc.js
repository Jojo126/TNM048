//

d3.json("data/data.json", function(error, graph) {
  if (error) throw error;

  document.getElementById('wordListTitle').innerHTML = 'Most relevant words for r/' + graph.nodes[0].id;
 
  let innerHTML = '';
  let firstIteration = true;
  let maxWidth,
      amountWidth,
      upWidth,
      downWidth;
  graph.nodes[0].words.forEach(wordObj => {

    if(firstIteration)
      {
        amountWidth = (100 / wordObj.score) * 100/2;
        firstIteration = false;
      }
    
    let score = wordObj.score;
    scoreWidth = score/100 * amountWidth;

    innerHTML += '<li><h3 class="word">' + wordObj.word + '</h3><div class="stapelCont"><h3 class="occurrences" title="occurrences: '+ wordObj.amount +'">' + wordObj.amount + '</h3><div class="stapel"><span class="background"></span>';
    // If positive score -> green span to left, otherwise red span to the right
    if (score >= 0) {
      innerHTML += '<span class="ups" title="score: ' + score + '" style="width: ' + scoreWidth + '%">' + score + '</span>';
    } else {
      innerHTML += '<span class="downs" title="score: ' + score + '" style="width: ' + -1*scoreWidth + '%; left: calc(50% - ' + -2*scoreWidth + 'px)">' + score + '</span>';
    }
    innerHTML += '</div></div></li>'; 
  });

  document.getElementById("wordlist").innerHTML = innerHTML;
});
