
var $searchInput = $("#searchInput");
var $searchButton = $("button[name=searchButton");
var $searchList = $(".searchResults ol");
var markets;
$searchButton.on("click", function (event) {
	var url = 'https://cors.io/?https://www.bittrex.com/api/v1.1/public/getmarkets';
	fetch(url).then(function(response) {
	  response.text().then(function(text) {
	    markets = JSON.parse(text);
	    displayResults();
	  });
	});
});

function displayResults(){
	console.log(markets.result[0].MarketCurrencyLong);
}
