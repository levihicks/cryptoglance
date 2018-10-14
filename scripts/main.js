var $searchInput = $("#searchInput");
var $searchButton = $("button[name=searchButton");
var $searchList = $(".searchResults ul");
var $main = $("main");
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
				var $coinInfoDiv = $("<div>").attr("class", "coinInfo");
				$coinInfoDiv.append($nameDiv);
				$coinInfoDiv.append($tagDiv);
				var $addButton = $("<button>").text("+").attr("name", "searchAdd");
				$addButton.click(function(){
					var $background = $("<div>").attr("class", "background");
					$background.innerHeight(window.innerHeight);
					$background.innerWidth(window.innerWidth);
					var $addPrompt = $("<div>").attr("class", "addPrompt");
					$addPrompt.offset({top: (window.innerHeight/2)-180, left: (window.innerWidth/2)-320});
					$main.append($background);
					$main.append($addPrompt);

				});
				var $addButtonDiv = $("<div>").attr("class", "searchAddContainer");
				$addButtonDiv.append($addButton);
				var $searchEl = $("<li>");
				$searchEl.append($addButtonDiv);
				$searchEl.append($coinInfoDiv);
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