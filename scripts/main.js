var $searchInput = $("#searchInput");
var $searchButton = $("button[name=searchButton");
var $searchList = $(".searchResults ul");
var $main = $("main");
var markets, query;
var marketsURL = 'https://cors.io/?https://www.bittrex.com/api/v1.1/public/getmarkets';

$searchInput.keyup(function(event){
	displayResults();
});

function displayAddForm($parent){
	var $background = $("<div>").attr("class", "background");
	$background.innerHeight(window.innerHeight);
	$background.innerWidth(window.innerWidth);
	var $addPrompt = $("<div>").attr("class", "addPrompt");
	$addPrompt.offset({top: (window.innerHeight/2)-180, left: (window.innerWidth/2)-320});
	var coinName = $parent.find(".searchName").html();
	var fullTag = $parent.find(".searchTag").html().slice(1, -1);
	var tags = fullTag.split("-");
	var baseTag = tags[0];
	var coinTag = tags[1];
	var $cancelButton = $("<button>").text("x").attr("name", "addCancel");
	var $cancelButtonDiv = $("<div>").attr("class", "cancelButtonContainer");
	$cancelButtonDiv.append($cancelButton);
	$addPrompt.append($cancelButtonDiv);
	var $addNameDiv = $("<div>").text(coinName).attr("class", "addNameContainer");
	$addPrompt.append($addNameDiv);
	var $addCoinForm = $("<form>").attr("class","addCoinForm");
	$addCoinForm.attr("onsubmit","return false;");
	var $addQuantityDiv = $("<div>").attr("class", "addQuantityContainer");
	var $addQuantityInput = $("<input>").attr("id", "addQuantity");
	$addQuantityInput.attr("type", "text");
	var $addQuantityLabel = $("<label>").attr("for", "addQuantity");
	$addQuantityLabel.text("Quantity (" + coinTag + "): ");
	$addQuantityDiv.append($addQuantityLabel);
	$addQuantityDiv.append($addQuantityInput);
	var $addCostDiv = $("<div>").attr("class", "addCostContainer");
	var $addCostInput = $("<input>").attr("id", "addCost");
	$addCostInput.attr("type", "text");
	var $addCostLabel = $("<label>").attr("for", "addCost");
	$addCostLabel.text("Cost (" + baseTag + "): ");
	$addCostDiv.append($addCostLabel);
	$addCostDiv.append($addCostInput);
	$addPrompt.append($addQuantityDiv);
	$addPrompt.append($addCostDiv);
	var $confirmAddButton = $("<input>").attr("type", "button");
	$confirmAddButton.attr("name", "confirmAddButton");
	$confirmAddButton.attr("value", "+");
	$confirmAddButton.attr("onclick", "");
	var $confirmAddDiv = $("<div>").attr("class", "confirmAddContainer");
	$confirmAddDiv.append($confirmAddButton);
	$addPrompt.append($confirmAddDiv);
	$main.append($background);
	$main.append($addPrompt);

}

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
					var $parent = $addButton.parent().parent();
					displayAddForm($parent);
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