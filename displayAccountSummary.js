var strings = stringsAll.displayAccountSummary;

var accounts = new Array();

$(".investments td a").each(function(){
  var curAccount = this.textContent.match(/\d+/)[0];
  
  accounts.push(curAccount);
  this.textContent += " - " + localStorage.getItem("nomPortefeuille"+curAccount+lang);
});

var len = accounts.length;
var i = 0;

function getFundNames(){
  if(i<len){
    $.get("https://secure.tangerine.ca/web/Tangerine.html?command=goToMutualFundAccount&mutualFundAccount="+i).done(function(){
      $.get("https://secure.tangerine.ca/web/Tangerine.html?command=displayMutualFundAccount").done(function(data){
        localStorage.setItem("nomPortefeuille"+accounts[i]+lang,$(data).find('[data-title="'+strings.nomPortefeuille+'"]').text());
        
        i++;
        getFundNames();  
      });  
    });
  }
}



getFundNames();