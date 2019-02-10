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
		if(!isIn)
			added.push(newCoin);
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
		if(!isIn)
			added.push(newCoin);
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
	return $("<td>").text(quantity).attr("class", "portfolioQuantity");
}

function portfolioCost(cost){
	return $("<td>").text(cost.toFixed(8)).attr("class", "portfolioCost");
}

function currentPrice(coin){
	var currentPrice = getCurrentPrice(coin);
	var $currentPriceContainer = $("<td>").attr("class", "currentPrice").text(currentPrice);
	return $currentPriceContainer;
}


function currentWorth(coin){
	var currentWorth = getCurrentWorth(coin);
	var $currentWorthContainer = $("<td>").attr("class", "currentWorth").text(currentWorth);
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

function displayPortfolioCoin(coin){
	$portfolioLi = $("<tr>");
	var $editButtonCell = editButtonDiv(coin);
	var $coinImageCell = coinImage(coin);
	var $nameContainer = portfolioName(coin.name);
	var $tagContainer = portfolioTag(coin.tag);
	var $nameAndTag = $("<td>");
	$nameAndTag.append($nameContainer, $tagContainer);
	var $amountCell = portfolioQuantity(coin.quantity);
	var $costCell = portfolioCost(coin.cost*coin.quantity);
	var $currentWorthCell = currentWorth(coin);
	var $currentPriceCell = currentPrice(coin);
	var $changeCell = priceChange(coin);
	var $deleteCell = deleteButton(coin);
	$portfolioLi.append($editButtonCell, $coinImageCell, $nameAndTag,
						$amountCell, $costCell, $currentWorthCell,
						$currentPriceCell, $changeCell, $deleteCell);
	$("#portfolio").append($portfolioLi);
}

function portfolioMsg(msg){
	$portfolioDiv.empty();
	var $msg = $("<div>").attr("class", "msg").text(msg);
	$portfolioDiv.append($msg);
}

function portfolioHead(){
	var $headRow = $("<tr>").attr("class", "portfolioHead");
	var headEls = new Array(9);
	var descriptorsAndText = [["edit",""], ["image",""], ["name","Name"],
							  ["quantity","Quantity"], 
							  ["initialCost","Initial Cost"],
							  ["currentWorth","Current Worth"],
							  ["currentPrice", "Current Price"],
							  ["change","Percent Change"],["delete",""]];
	for(var i=0; i<headEls.length;i++){
		descriptorsAndText[i][0]+="Head";
		headEls[i]=$("<th>");
		headEls[i].attr("class", descriptorsAndText[i][0]);
		headEls[i].text(descriptorsAndText[i][1]);
		$headRow.append(headEls[i]);
	}
	return $headRow;
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
		var $headRow = portfolioHead();
		$portfolio.append($headRow);
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

var tickerEl = document.createElement('canvas');
tickerEl.setAttribute("class", "ticker");
tickerEl.width=window.innerWidth;
this.tickerEl.height=35;
var ctx = tickerEl.getContext('2d');
ctx.fillStyle='black';
ctx.fillRect(0,0,tickerEl.width,tickerEl.height);
$header.prepend(tickerEl);

/*var marketSummariesTest = [];
marketSummariesTest.push({'MarketName':'USDT-TSD1', 'Last': 1.00490029, 'PrevDay': 1});
marketSummariesTest.push({'MarketName':'USDT-TSD2', 'Last': 1.00490029, 'PrevDay': 1});
marketSummariesTest.push({'MarketName':'USDT-TSD3', 'Last': 1.00490029, 'PrevDay': 1});
marketSummariesTest.push({'MarketName':'USDT-TSD4', 'Last': 1.00490029, 'PrevDay': 1});
marketSummariesTest.push({'MarketName':'USDT-TSD5', 'Last': 1.00490029, 'PrevDay': 1});
*/

function Ticker(){
	this.elWidth = this.offset = 280;
	this.count = Math.ceil(tickerEl.width/this.offset)+1;
	this.incrementers = [this.count];
	for(let i = 0; i < this.count; i++){
		this.incrementers[i]=-1;
	}
	this.tick = function (){
			if(this.offset==this.elWidth){
				for(let i = 0; i < this.count; i++){
					this.incrementers[i]+=1;
				}
				this.offset=0;
			}
			ctx.fillStyle = 'black';
		    ctx.fillRect(0,0,tickerEl.width,tickerEl.height);
			for(var i = 0; i<this.count; i++){
				ctx.fillStyle = 'white';
				ctx.font = '18px monospace';
				if(i+this.incrementers[i] == marketSummaries.length)
					this.incrementers[i]=-i;
				var current = marketSummaries[i+this.incrementers[i]];
				var name = current['MarketName'];
				ctx.fillText(name+" ", i*this.elWidth-this.offset+5,23);
				var change = (current['Last']/current['PrevDay'])*100-100;
				ctx.fillStyle = (change==0)?"gray":(change>=0)?"lightgreen":"#ff6666";
				ctx.font = ('14px monospace');
				ctx.fillText(current['Last'].toFixed(8)+"("+change.toFixed(3)+"%)", 
							i*this.elWidth-this.offset+name.length*12, 22);
				
			}
			this.offset+=1;
	}
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
var ticker1 = new Ticker();
function loop(){
	ticker1.tick();
	requestAnimationFrame(loop);
}
var main = function(){
	checkLocal();
	$searchInput.val("");
	
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
			
			loop();

		})
	});
};

$(document).ready(main);
