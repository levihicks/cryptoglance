var $searchInput = $("#searchInput");
var $searchButton = $("button[name=searchButton]");
var $searchList = $(".searchResults ul");
var $main = $("main");
var $header=$("header");
var $portfolioDiv = $(".portfolioContainer");
var markets, query, marketSummaries;
var marketsURL = 'https://cors.io/?https://www.bittrex.com/api/v1.1/public/getmarkets';
var marketSummariesURL = 'https://cors.io/?https://bittrex.com/api/v1.1/public/getmarketsummaries';
var added = [];
var loadingComplete = false;
$searchInput.keyup(function(event){
	displayResults();
});
var re = /^([\d]*[\.]?[\d]+)|([\d]+[\.])$/;

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
		updateLocal();
		removeAddPrompt($cancelButtonDiv.parent());
		updatePortfolio();
	}
}

function confirmEditClick(event){
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
				coin.cost = newCoin.cost;
				coin.quantity =newCoin.quantity;
				isIn = true;
			}
		});
		if(!isIn){
			added.push(newCoin);
			console.log("added");
		}
		updateLocal();
		removeAddPrompt($cancelButtonDiv.parent());
		updatePortfolio();
	}
}

function confirmAddDiv(val, fullTag, coinName, $cancelButtonDiv){
	var $confirmAddButton = $("<input>").attr("type", "button");
	$confirmAddButton.attr("name", "confirmAddButton");
	$confirmAddButton.attr("value", val);
	$confirmAddButton.on("click", {fullTag: fullTag, coinName: coinName, $cancelButtonDiv: $cancelButtonDiv}, confirmAddClick);
	var $confirmAddDiv = $("<div>").attr("class", "confirmAddContainer");
	$confirmAddDiv.append($confirmAddButton);
	
	return $confirmAddDiv;
}

function confirmEditDiv(val, fullTag, coinName, $cancelButtonDiv){
	var $confirmAddButton = $("<input>").attr("type", "button");
	$confirmAddButton.attr("name", "confirmAddButton");
	$confirmAddButton.attr("value", val);
	$confirmAddButton.on("click", {fullTag: fullTag, coinName: coinName, $cancelButtonDiv: $cancelButtonDiv}, confirmEditClick);
	var $confirmAddDiv = $("<div>").attr("class", "confirmAddContainer");
	$confirmAddDiv.append($confirmAddButton);
	return $confirmAddDiv;
}

function displayAddForm($parent){
	var $addPrompt = addPrompt();
	var coinName = $parent.find(".searchName").html();
	var fullTag = $parent.find(".searchTag").html().slice(1, -1);
	var tags = fullTag.split("-");
	var baseTag = tags[0];
	var coinTag = tags[1];
	var $cancelButtonDiv = cancelButtonDiv();
	var $addNameDiv = $("<div>").text(coinName).attr("class", "addNameContainer");
	var $confirmAddDiv = confirmAddDiv("+",fullTag, coinName, $cancelButtonDiv);
	$addPrompt.append($cancelButtonDiv, $addNameDiv, addQuantityDiv(coinTag), addCostDiv(baseTag), $confirmAddDiv);
	$main.append(promptBackground(), $addPrompt);
}

function getCurrentPrice(coin){
	if(marketSummaries){
		var result;
		marketSummaries.forEach(function(marketCoin){
			if(marketCoin.MarketName==coin.tag){
				result = marketCoin.Last;
				return;
			}
		});
	}
	return result.toFixed(8);
}

function getCurrentWorth(coin){
	return (getCurrentPrice(coin) * coin.quantity).toFixed(8);
}

function editButtonDiv(coin){
	var $editButtonContainer = $("<td>").attr("class", "editButton");
	var $editButton = $("<input>").attr("value", "[Edit]").attr("type", "button");
	$editButton.click(function(){
		added.forEach(function(addedCoin){
			if(addedCoin.name==coin.name){
				var $addPrompt = addPrompt();
				var coinName = addedCoin.name;
				var fullTag = addedCoin.tag;
				var $cancelButtonDiv = cancelButtonDiv();
				var tags = fullTag.split("-");
				var baseTag = tags[0];
				var coinTag = tags[1];
				var $addNameDiv = $("<div>").text(coinName).attr("class", "addNameContainer");
				var $confirmAddDiv = confirmEditDiv("Update", fullTag, coinName, $cancelButtonDiv);
				$addPrompt.append($cancelButtonDiv, $addNameDiv, addQuantityDiv(coinTag), addCostDiv(baseTag),  $confirmAddDiv);
				$main.append(promptBackground(), $addPrompt);
			}
		});
	});
	$editButtonContainer.append($editButton);
	return $editButtonContainer;
}

function portfolioName(name) {
	return $("<div>").text(name).attr("class", "portfolioName");
}

function portfolioTag(tag){
	return  $("<div>").text("("+tag+")").attr("class", "portfolioTag");
}

function portfolioQuantity(quantity){
	return $("<div>").text("Total Quantity: "+quantity).attr("class", "portfolioQuantity");
}

function portfolioCost(cost){
	return $("<div>").text("Total Initial Cost: "+cost.toFixed(8)).attr("class", "portfolioCost");
}

function currentPrice(coin){
	var currentPrice = getCurrentPrice(coin);
	var $currentPriceContainer = $("<div>").attr("class", "currentPrice").text("Current Price: "+currentPrice);
	return $currentPriceContainer;
}


function currentWorth(coin){
	var currentWorth = getCurrentWorth(coin);
	var $currentWorthContainer = $("<div>").attr("class", "currentWorth").text("Total Current Worth: "+currentWorth);
	return $currentWorthContainer;
}

function deletePrompt(){
	var $deletePrompt = $("<div>").attr("class", "deleteConfirm");
	$deletePrompt.offset({top: (window.innerHeight/2)-100, left: (window.innerWidth/2)-250});
	return $deletePrompt;
}

function confirmDeleteContainer(coin){
	var confirmDeleteString = "Are you sure you want to delete "+coin.name+" ("+coin.tag+")?";
	var $confirmDeleteContainer = $("<div>").attr("class", "deleteQuestion").text(confirmDeleteString);
	return $confirmDeleteContainer;
}

function cancelDeleteButton(){
	var $cancelDeleteButton = $("<input>").attr("id", "cancelDelete").attr("type", "button").val("No");
	$cancelDeleteButton.click(function(){
		removeAddPrompt($cancelDeleteButton.parent().parent());
	});
	return $cancelDeleteButton;
}

function confirmDeleteButton(coin){
	var $confirmDeleteButton = $("<input>").attr("id", "confirmDelete").attr("type", "button").val("Yes");
	$confirmDeleteButton.click(function(){
		added.forEach(function(addedCoin){
			if(addedCoin.tag==coin.tag)
				added.splice(added.indexOf(addedCoin), 1);
		});
		updateLocal();
		removeAddPrompt($confirmDeleteButton.parent().parent());
		updatePortfolio();
	});
	return $confirmDeleteButton;
}

function updateLocal(){
	if(added.length==0)
		localStorage.removeItem("coins");
	else
		localStorage.setItem("coins", JSON.stringify(added));
}

function deleteButton(coin){
	var $deleteContainer = $("<td>").attr("class", "delete");
	var $deleteButton = $("<input>").attr("type", "image").attr("src", "./images/del.png");
	$deleteButton.click(function(){
		var $deletePrompt = deletePrompt();
		var $deleteForm = $("<form>").attr("id", "deleteForm");
		$deleteForm.append(confirmDeleteContainer(coin), cancelDeleteButton(), confirmDeleteButton(coin))
		$deletePrompt.append($deleteForm);
		$main.append(promptBackground(), $deletePrompt);
	});
	$deleteContainer.append($deleteButton);
	return $deleteContainer;
}

function priceChange(coin){
	var change = ((getCurrentWorth(coin)/(coin.cost*coin.quantity)) * 100)-100;
	change=change.toFixed(3);
	var indicator = (change>=0)?"▲ ":"▼ ";
	var $changeContainer = $("<td>").attr("class","portfolioChange").text(indicator+change+"%");
	var color = (change>=0)?"green":"red";
	$changeContainer.attr("style", "color: "+color+";");
	return $changeContainer;
}

function currentInfo(coin){
	var $currentWorthContainer = currentWorth(coin);
	var $currentPriceContainer = currentPrice(coin);
	var $currentInfoContainer = $("<div>").attr("class", "current");
	$currentInfoContainer.append($currentWorthContainer, $currentPriceContainer);
	return $currentInfoContainer;
}

function displayPortfolioCoin(coin){
	$portfolioLi = $("<tr>");
	var $editButtonContainer = editButtonDiv(coin);
	var $coinImageContainer = coinImage(coin);
	var $nameContainer = portfolioName(coin.name);
	var $tagContainer = portfolioTag(coin.tag);
	var $amountContainer = portfolioQuantity(coin.quantity);
	var $costContainer = portfolioCost(coin.cost*coin.quantity);
	var $currentInfoContainer = currentInfo(coin);
	var $changeContainer = priceChange(coin);
	var $portfolioInfoContainer = $("<div>").attr("class", "portfolioInfo");
	var $deleteContainer = deleteButton(coin);
	var $allCoinInfo = $("<td>").attr("class", "allCoinInfo");
	$portfolioInfoContainer.append($nameContainer, $tagContainer, $amountContainer, $costContainer);
	$allCoinInfo.append($portfolioInfoContainer, $currentInfoContainer);
	$portfolioLi.append($editButtonContainer, $coinImageContainer, $allCoinInfo,
					    $changeContainer, $deleteContainer);
	$("#portfolio").append($portfolioLi);
}

function portfolioMsg(msg){
	$portfolioDiv.empty();
	var $msg = $("<div>").attr("class", "msg").text(msg);
	$portfolioDiv.append($msg);
}

function updatePortfolio(){
	if (added.length != 0){
		$(".msg").remove();
		if($portfolioDiv.find("#portfolio").length>0){
			var $portfolio = $("#portfolio");
			$portfolio.empty();
		}
		else{
			var $portfolio = $("<table>").attr("id", "portfolio");
			$portfolioDiv.append($portfolio);
		}
		added.forEach(function(coin){
				displayPortfolioCoin(coin);
		});
	}
	else{
		portfolioMsg("No coins in your portfolio.");
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

function checkLocal(){
	if(localStorage.getItem("coins"))
		added = JSON.parse(localStorage.getItem("coins"));
	var msg = (added.length > 0)?"Loading...":"No coins in your portfolio.";
	portfolioMsg(msg);
}

function createTicker(){
	var $ticker = $("<canvas>").attr("style", "background: black;");
	$ticker.width(window.innerWidth);
	$ticker.height(20);
	$header.prepend($ticker);
}

function coinImage(coin){
	var imgURL;
	for(var i = 0; i < markets.length; i++){
		var market = markets[i];
		if(market.MarketName==coin.tag){
			imgURL = market.LogoUrl;
			break;
		}
	}
	var $coinImageContainer = $("<td>").attr("class", "coinImage");
	var $coinImage = $("<img>").attr("src", imgURL);
	 $coinImage.height(30);
	 $coinImage.width(30);
	$coinImageContainer.append($coinImage);
	return $coinImageContainer;
}

var main = function(){
	checkLocal();
	$searchInput.val("");
	createTicker();
	fetch(marketsURL).then(function(response) {
	  	response.text().then(function(text) {
	    markets = JSON.parse(text);
	    markets = markets.result;
	    if($searchInput != "")   	
	    	displayResults();
	    if(marketSummaries){
	    	loadingComplete = true;
			updatePortfolio();
		}
	    
	  });
	});
	fetch(marketSummariesURL).then(function(response){
		response.text().then(function(text){
			marketSummaries = JSON.parse(text);
			marketSummaries = marketSummaries.result;
			if(markets){
				loadingComplete = true;
		    	updatePortfolio();
			}
			
		})
	});
};

$(document).ready(main);