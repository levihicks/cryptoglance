var $searchInput = $("#searchInput");
var $searchButton = $("button[name=searchButton");
var $searchList = $(".searchResults ul");
var markets, query;
var marketsURL = 'https://cors.io/?https://www.bittrex.com/api/v1.1/public/getmarkets';

$searchInput.keyup(function(event){
	displayResults();
});

function displayResults(){
	query = $searchInput.val();
	$searchList.empty();
	if(markets){
		markets.forEach(function(market){
			if ((market.MarketCurrencyLong.toLowerCase().startsWith(query.toLowerCase())
				|| market.MarketCurrency.toLowerCase().startsWith(query.toLowerCase()))
				&& query!="")
			{
				var $tagDiv = $("<div>").text("("+market.MarketName+")").attr("class", "searchTag");
				var $nameDiv = $("<div>").text(market.MarketCurrencyLong).attr("class", "searchName");
				var $searchEl = $("<li>");
				$searchEl.append($nameDiv);
				$searchEl.append($tagDiv);
				$searchList.append($searchEl);
			}
		});
	}
	else{
		$searchList.append($("<li>").text('Loading...'));
	}
}

var main = function(){
	$searchInput.val("");
	fetch(marketsURL).then(function(response) {
	  	response.text().then(function(text) {
	    markets = JSON.parse(text);
	    markets = markets.result;
	    if($searchInput != "")
	    	displayResults();
	  });
	});
};

$(document).ready(main);