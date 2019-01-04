var $searchInput = $("#searchInput");
var $searchButton = $("button[name=searchButton]");
var $searchList = $(".searchResults ul");
var $main = $("main");
var $portfolioDiv = $(".portfolioContainer");
var markets, query, marketSummaries;

var marketsURL = 'https://cors.io/?https://www.bittrex.com/api/v1.1/public/getmarkets';
var marketSummariesURL = 'https://cors.io/?https://bittrex.com/api/v1.1/public/getmarketsummaries';
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

function promptBackground(){
	var $background = $("<div>").attr("class", "background");
	$background.innerHeight(window.innerHeight);
	$background.innerWidth(window.innerWidth);
	return $background;
}

function addPrompt(){
	var $addPrompt = $("<div>").attr("class", "addPrompt");
	$addPrompt.offset({top: (window.innerHeight/2)-100, left: (window.innerWidth/2)-250});
	return $addPrompt;
}

function cancelButtonDiv(){
	var $cancelButton = $("<button>").text("x").attr("name", "addCancel");
	var $cancelButtonDiv = $("<div>").attr("class", "cancelButtonContainer");
	$cancelButtonDiv.append($cancelButton);
	$cancelButton.click(function(){
		removeAddPrompt($cancelButtonDiv.parent());
	});
	return $cancelButtonDiv;
}

function addQuantityDiv(coinTag){
	var $addQuantityDiv = $("<div>").attr("class", "addQuantityContainer");
	var $addQuantityInput = $("<input>").attr("id", "addQuantity");
	$addQuantityInput.attr("type", "text");
	var $addQuantityLabel = $("<label>").attr("for", "addQuantity");
	$addQuantityLabel.text("Quantity (" + coinTag + "): ");
	$addQuantityDiv.append($addQuantityLabel, $addQuantityInput);
	return $addQuantityDiv;
}

function addCostDiv(baseTag){
	var $addCostDiv = $("<div>").attr("class", "addCostContainer");
	var $addCostInput = $("<input>").attr("id", "addCost");
	$addCostInput.attr("type", "text");
	var $addCostLabel = $("<label>").attr("for", "addCost");
	$addCostLabel.text("Cost (" + baseTag + "): ");
	$addCostDiv.append($addCostLabel, $addCostInput);
	return $addCostDiv;
}

function confirmAddClick(event){
	var fullTag = event.data.fullTag;
	var coinName = event.data.coinName;
	var $cancelButtonDiv = event.data.$cancelButtonDiv;
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
}

function confirmAddDiv(fullTag, coinName, $cancelButtonDiv){
	var $confirmAddButton = $("<input>").attr("type", "button");
	$confirmAddButton.attr("name", "confirmAddButton");
	$confirmAddButton.attr("value", "+");
	$confirmAddButton.on("click", {fullTag: fullTag, coinName: coinName, $cancelButtonDiv: $cancelButtonDiv}, confirmAddClick);
	var $confirmAddDiv = $("<div>").attr("class", "confirmAddContainer");
	$confirmAddDiv.append($confirmAddButton);
	
	return $confirmAddDiv;
}

function displayAddForm($parent){
	var $background = promptBackground();
	var $addPrompt = addPrompt();
	var coinName = $parent.find(".searchName").html();
	var fullTag = $parent.find(".searchTag").html().slice(1, -1);
	var tags = fullTag.split("-");
	var baseTag = tags[0];
	var coinTag = tags[1];
	var $cancelButtonDiv = cancelButtonDiv();
	var $addNameDiv = $("<div>").text(coinName).attr("class", "addNameContainer");
	var $addQuantityDiv = addQuantityDiv(coinTag);
	var $addCostDiv = addCostDiv(baseTag);
	var $confirmAddDiv = confirmAddDiv(fullTag, coinName, $cancelButtonDiv);
	$addPrompt.append($cancelButtonDiv, $addNameDiv, $addQuantityDiv, $addCostDiv, $confirmAddDiv);
	$main.append($background);
	$main.append($addPrompt);

}

function getCurrentWorth(coin){
	if(marketSummaries){
		var result;
		marketSummaries.forEach(function(marketCoin){
			if(marketCoin.MarketName==coin.tag){
				result = marketCoin.Last;
				return;
			}
		});
	}
	return (result * coin.quantity).toFixed(8);
}

function displayPortfolioCoin(coin){
	$portfolioLi = $("<li>");
	var $editButtonContainer = $("<div>").attr("class", "editButton");
	var $editButton = $("<input>").attr("value", "[Edit]").attr("type", "button");
	$editButtonContainer.append($editButton);
	var $nameContainer = $("<div>").text(coin.name).attr("class", "portfolioName");
	var $tagContainer = $("<div>").text("("+coin.tag+")").attr("class", "portfolioTag");
	var $amountContainer = $("<div>").text("Total Quantity: "+coin.quantity).attr("class", "portfolioQuantity");
	var $costContainer = $("<div>").text("Total Initial Cost: "+(coin.cost*coin.quantity).toFixed(8)).attr("class", "portfolioCost");
	var currentWorth = getCurrentWorth(coin);
	
	var $currentWorthContainer = $("<div>").attr("class", "currentWorth").text("Total Current Worth: "+currentWorth);
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
	$deleteButton.click(function(){
		var $background = $("<div>").attr("class", "background");
		$background.innerHeight(window.innerHeight);
		$background.innerWidth(window.innerWidth);
		var $deletePrompt = $("<div>").attr("class", "deleteConfirm");
		$deletePrompt.offset({top: (window.innerHeight/2)-100, left: (window.innerWidth/2)-250});
		var confirmDeleteString = "Are you sure you want to delete "+coin.name+" ("+coin.tag+")?";
		var $confirmDeleteContainer = $("<div>").attr("class", "deleteQuestion").text(confirmDeleteString);
		var $cancelDeleteButton = $("<input>").attr("id", "cancelDelete").attr("type", "button").val("No");
		$cancelDeleteButton.click(function(){
			removeAddPrompt($cancelDeleteButton.parent().parent());
		});
		var $confirmDeleteButton = $("<input>").attr("id", "confirmDelete").attr("type", "button").val("Yes");
		$confirmDeleteButton.click(function(){
			added.forEach(function(addedCoin){
				if(addedCoin.tag==coin.tag)
					added.splice(added.indexOf(addedCoin), 1);
			});
			removeAddPrompt($confirmDeleteButton.parent().parent());
			updatePortfolio();
		});
		var $deleteForm = $("<form>").attr("id", "deleteForm");
		$deleteForm.append($confirmDeleteContainer, $cancelDeleteButton, $confirmDeleteButton)
		$deletePrompt.append($deleteForm);
		$main.append($background, $deletePrompt);
	});
	$deleteContainer.append($deleteButton);
	$portfolioInfoContainer.append($nameContainer, $tagContainer, $amountContainer, $costContainer);
	$portfolioLi.append($editButtonContainer, $portfolioInfoContainer, $currentWorthContainer, $deleteContainer);
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
	else{
		$portfolioDiv.empty();
		var $msg = $("<div>").attr("class", "msg").text("No coins in your portfolio.");
		$portfolioDiv.append($msg);
	}
}

function searchTagDiv(market){
	return $("<div>").text("("+market.MarketName+")").attr("class", "searchTag");
}

function searchNameDiv(market){
	return $("<div>").text(market.MarketCurrencyLong).attr("class", "searchName");
}

function searchAddButton(){
	var $addButton = $("<button>").text("+").attr("name", "searchAdd");
	
	$addButton.on("click", function(){
		var $parent = $addButton.parent().parent();
		displayAddForm($parent);
	});
	var $addButtonDiv = $("<div>").attr("class", "searchAddContainer");
	$addButtonDiv.append($addButton);
	return $addButtonDiv;
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
				var $tagDiv = searchTagDiv(market);
				var $nameDiv = searchNameDiv(market);
				var $coinInfoDiv = $("<div>").attr("class", "coinInfo");
				$coinInfoDiv.append($nameDiv, $tagDiv);
				var $addButtonDiv = searchAddButton();
				var $searchEl = $("<li>");
				$searchEl.append($addButtonDiv, $coinInfoDiv);
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
	fetch(marketSummariesURL).then(function(response){
		response.text().then(function(text){
			marketSummaries = JSON.parse(text);
			marketSummaries = marketSummaries.result;
			console.log("market summaries loaded");
		})
	});
};

$(document).ready(main);