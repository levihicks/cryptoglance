var $searchInput = $("#searchInput");
var $searchButton = $("button[name=searchButton");
var $searchList = $(".searchResults ul");
var markets, query;
var marketsURL = 'https://cors.io/?https://www.bittrex.com/api/v1.1/public/getmarkets';


$searchInput.keyup(function(event){
	query = event.target.value;
	$searchList.empty();
	if(markets){
		markets.forEach(function(market){
			if ((market.MarketCurrencyLong.toLowerCase().startsWith(query.toLowerCase())
				|| market.MarketCurrency.toLowerCase().startsWith(query.toLowerCase()))
				&& query!="")
				$searchList.append($("<li>").text(market.MarketCurrencyLong));
		});
	}
});

var main = function(){
	fetch(marketsURL).then(function(response) {
	  	response.text().then(function(text) {
	    markets = JSON.parse(text);
	    markets = markets.result;
	  });
	});
};

$(document).ready(main);