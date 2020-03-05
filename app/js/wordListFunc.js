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
        maxWidth = wordObj.score;
        firstIteration = false;
      }

    let upVotes = wordObj.score; //wordObj.upVotes;
    let downVotes = wordObj.score; //wordObj.downVotes;
    amountWidth = (wordObj.amount / maxWidth) * 100 /30; // /30 only temp
    upWidth = upVotes/100 * amountWidth;
    downWidth = downVotes/100 * amountWidth;

    innerHTML += '<li><h3 class="word">' + wordObj.word + '</h3><div class="stapelCont"><h3 class="occurrences" title="occurrences: '+ wordObj.amount +'">' + wordObj.amount + '</h3><div class="stapel"><span class="background"></span><span class="ups" title="upvotes: ' + upVotes + '%" style="width: ' + upWidth + '%">' + upVotes + '%</span><span class="downs" title="downvotes: ' + downVotes + '%" style="width: ' + downWidth + '%">' + downVotes + '%</span></div></div></li>';
  });

  document.getElementById("wordlist").innerHTML = innerHTML;
});
