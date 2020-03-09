d3.json("data/data.json", function(error, graph) {
  if (error) throw error;

  wordsOfReddit(graph);
});

function wordsOfReddit(graph) {
  document.getElementById('wordListTitle').innerHTML = 'Most relevant words in Reddit';

  let maxScore = 0,
      minScore = 0;
  graph.words.forEach(wordObj => {

    if (maxScore < wordObj.score)
      maxScore = wordObj.score;
    if (minScore > wordObj.score)
      minScore = wordObj.score;      
  });
  
  console.log(maxScore);
  let innerHTML = '';
  let amountWidth,
      largestScore;
  graph.words.forEach(wordObj => {

    (maxScore*maxScore > minScore*minScore) ? largestScore = maxScore : largestScore = minScore;
    amountWidth = (100 / largestScore) * 100/2;
    
    let score = wordObj.score;
    scoreWidth = score/100 * amountWidth;

    // Render wordlist
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
}
