var $searchInput = $("#searchInput");
var $searchButton = $("button[name=searchButton]");
var $searchList = $(".searchResults ul");
var $main = $("main");
var $portfolioDiv = $(".portfolioContainer");
var markets, query;
var marketsURL = 'https://cors.io/?https://www.bittrex.com/api/v1.1/public/getmarkets';
var added = [];
$searchInput.keyup(function(event){
	displayResults();
});
var re = /(^[\d]*[\.]?[\d]+$)|(^[\d]+[\.]$)/;

function removeAddPrompt($parent){
	$parent.prev().remove();
	$parent.remove();
}

function displayAddError(msg){
	var $promptBox = $(".addPrompt");
	var $errorContainer = $("<div>").text(msg).attr("class", "addError");
	if($promptBox.children().last().attr("class")=="addError"){
		$promptBox.children().last().remove();
	}
	$promptBox.append($errorContainer);
}

function checkInput(quantity, cost){
	switch(false){
		case re.test(quantity):
			displayAddError("Invalid Quantity");
			return false;
		case re.test(cost):
			displayAddError("Invalid Cost");
			return false;
		default:
			return true;
	}	
}

function displayAddForm($parent){
	var $background = $("<div>").attr("class", "background");
	$background.innerHeight(window.innerHeight);
	$background.innerWidth(window.innerWidth);
	var $addPrompt = $("<div>").attr("class", "addPrompt");
	$addPrompt.offset({top: (window.innerHeight/2)-100, left: (window.innerWidth/2)-250});
	var coinName = $parent.find(".searchName").html();
	var fullTag = $parent.find(".searchTag").html().slice(1, -1);
	var tags = fullTag.split("-");
	var baseTag = tags[0];
	var coinTag = tags[1];
	var $cancelButton = $("<button>").text("x").attr("name", "addCancel");
	var $cancelButtonDiv = $("<div>").attr("class", "cancelButtonContainer");
	$cancelButtonDiv.append($cancelButton);
	$cancelButton.click(function(){
		removeAddPrompt($cancelButtonDiv.parent());
	});
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
	$confirmAddButton.click(function(){
		var quantity = Number($("#addQuantity").val());
		var cost = Number($("#addCost").val());
		if(checkInput(quantity, cost)){
			var tag = fullTag;
			var newCoin = {name: coinName, tag: tag, quantity: quantity, cost: cost};
			var isIn = false;
			added.forEach (function (coin){
				if (coin.tag == newCoin.tag){
					coin.cost = ((coin.cost*coin.quantity)+(newCoin.cost*newCoin.quantity))/(newCoin.quantity+coin.quantity);
					coin.quantity+=newCoin.quantity;
					isIn = true;
				}
			});
			if(!isIn){
				added.push(newCoin);
				console.log("added");
			}
			removeAddPrompt($cancelButtonDiv.parent());
			updatePortfolio();
		}
	});
	$addPrompt.append($confirmAddDiv);
	$main.append($background);
	$main.append($addPrompt);

}

function displayPortfolioCoin(coin){
	$portfolioLi = $("<li>");
	var $editButtonContainer = $("<div>").attr("class", "editButton");
	var $editButton = $("<input>").attr("value", "[Edit]").attr("type", "button");
	$editButtonContainer.append($editButton);
	var $nameContainer = $("<div>").text(coin.name).attr("class", "portfolioName");
	var $tagContainer = $("<div>").text("("+coin.tag+")").attr("class", "portfolioTag");
	var $amountContainer = $("<div>").text("Total Quantity: "+coin.quantity).attr("class", "portfolioQuantity");
	var $costContainer = $("<div>").text("Total Initial Cost: "+(coin.cost*coin.quantity)).attr("class", "portfolioCost");
	var $portfolioInfoContainer = $("<div>").attr("class", "portfolioInfo");
	$editButton.click(function(){
		added.forEach(function(addedCoin){
			if(addedCoin.name==coin.name){
				var $background = $("<div>").attr("class", "background");
				$background.innerHeight(window.innerHeight);
				$background.innerWidth(window.innerWidth);
				var $addPrompt = $("<div>").attr("class", "addPrompt");
				$addPrompt.offset({top: (window.innerHeight/2)-100, left: (window.innerWidth/2)-250});
				var coinName = addedCoin.name
				var fullTag = addedCoin.tag;
				var tags = fullTag.split("-");
				var baseTag = tags[0];
				var coinTag = tags[1];
				var $cancelButton = $("<button>").text("x").attr("name", "addCancel");
				var $cancelButtonDiv = $("<div>").attr("class", "cancelButtonContainer");
				$cancelButtonDiv.append($cancelButton);
				$cancelButton.click(function(){
					removeAddPrompt($cancelButtonDiv.parent());
				});
				$addPrompt.append($cancelButtonDiv);
				var $addNameDiv = $("<div>").text(coinName).attr("class", "addNameContainer");
				$addPrompt.append($addNameDiv);
				var $addCoinForm = $("<form>").attr("class","addCoinForm");
				$addCoinForm.attr("onsubmit","return false;");
				var $addQuantityDiv = $("<div>").attr("class", "addQuantityContainer");
				var $addQuantityInput = $("<input>").attr("id", "addQuantity").attr("value", addedCoin.quantity);
				$addQuantityInput.attr("type", "text");
				var $addQuantityLabel = $("<label>").attr("for", "addQuantity");
				$addQuantityLabel.text("Quantity (" + coinTag + "): ");
				$addQuantityDiv.append($addQuantityLabel);
				$addQuantityDiv.append($addQuantityInput);
				var $addCostDiv = $("<div>").attr("class", "addCostContainer");
				var $addCostInput = $("<input>").attr("id", "addCost").attr("value", addedCoin.cost);
				$addCostInput.attr("type", "text");
				var $addCostLabel = $("<label>").attr("for", "addCost");
				$addCostLabel.text("Cost (" + baseTag + "): ");
				$addCostDiv.append($addCostLabel);
				$addCostDiv.append($addCostInput);
				$addPrompt.append($addQuantityDiv);
				$addPrompt.append($addCostDiv);
				var $confirmAddButton = $("<input>").attr("type", "button");
				$confirmAddButton.attr("name", "confirmAddButton");
				$confirmAddButton.attr("value", "Update");
				$confirmAddButton.attr("onclick", "");
				var $confirmAddDiv = $("<div>").attr("class", "confirmAddContainer");
				$confirmAddDiv.append($confirmAddButton);
				$confirmAddButton.click(function(){
					var quantity = Number($("#addQuantity").val());
					var cost = Number($("#addCost").val());
					if(checkInput(quantity, cost)){
						var tag = fullTag;
						var newCoin = {name: coinName, tag: tag, quantity: quantity, cost: cost};
						var isIn = false;
						added.forEach (function (coin){
							if (coin.tag == newCoin.tag){
								coin.quantity = newCoin.quantity;
								coin.cost = newCoin.cost;
								isIn = true;
							}
						});
						if(!isIn){
							added.push(newCoin);
							console.log("added");
						}
						removeAddPrompt($cancelButtonDiv.parent());
						updatePortfolio();
					}
			});
				$addPrompt.append($confirmAddDiv);
				$main.append($background);
				$main.append($addPrompt);
			}
		})
	})
	var $deleteContainer = $("<div>").attr("class", "delete");
	var $deleteButton = $("<input>").attr("type", "image").attr("src", "./images/del.png");
	$deleteContainer.append($deleteButton);
	$portfolioInfoContainer.append($nameContainer, $tagContainer, $amountContainer, $costContainer);
	$portfolioLi.append($editButtonContainer, $portfolioInfoContainer, $deleteContainer);
	$("#portfolio").append($portfolioLi);

}

function updatePortfolio(){
	if (added.length != 0){
		$(".msg").remove();
		if($portfolioDiv.find("#portfolio").length>0){
			var $portfolio = $("#portfolio");
			$portfolio.empty();
			
		}
			
		else{
			var $portfolio = $("<ul>").attr("id", "portfolio");
			$portfolioDiv.append($portfolio);
		}
		
		added.forEach(function(coin){
				displayPortfolioCoin(coin);
		});
	}
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