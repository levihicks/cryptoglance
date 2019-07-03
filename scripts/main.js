var $searchInput = $("#searchInput");
var $searchButton = $("button[name=searchButton]");
var $searchList = $(".searchResults ul");
var $main = $("main");
var $header=$("header");
var $portfolioDiv = $(".portfolioContainer");
var markets, query, marketSummaries;
var marketsURL = 'https://cors-anywhere.herokuapp.com/https://www.bittrex.com/api/v1.1/public/getmarkets';
var marketSummariesURL = 'https://cors-anywhere.herokuapp.com/https://bittrex.com/api/v1.1/public/getmarketsummaries';
var added = [];
var loadingComplete = summariesLoading = false;
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

function addEditQuantityDiv(q, coinTag){
	var $addQuantityDiv = addQuantityDiv(coinTag);
	$addQuantityDiv.find("#addQuantity").val(q);
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

function addEditCostDiv(c, baseTag){
	var $addCostDiv = addCostDiv(baseTag);
	$addCostDiv.find("#addCost").val(c);
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

function confirmAddButton(val, fullTag, coinName, $cancelButtonDiv){
	var $confirmAddButton = $("<input>").attr("type", "button");
	$confirmAddButton.attr("name", "confirmAddButton");
	$confirmAddButton.attr("value", val);
	$confirmAddButton.on("click", {fullTag: fullTag, coinName: coinName, $cancelButtonDiv: $cancelButtonDiv}, confirmAddClick);
	return $confirmAddButton;
}

function confirmEditButton(val, fullTag, coinName, $cancelButtonDiv){
	var $confirmAddButton = $("<input>").attr("type", "button");
	$confirmAddButton.attr("name", "confirmAddButton");
	$confirmAddButton.attr("value", val);
	$confirmAddButton.on("click", {fullTag: fullTag, coinName: coinName, $cancelButtonDiv: $cancelButtonDiv}, confirmEditClick);
	return $confirmAddButton;
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
	var $confirmAddButton = confirmAddButton("+",fullTag, coinName, $cancelButtonDiv);
	var $confirmAddDiv = $("<div>").attr("class","confirmAddContainer");
	var $addQuantityDiv = addQuantityDiv(coinTag);
	var $addCostDiv = addCostDiv(baseTag);
	$addPrompt.keyup(function(event){
		if(event.keyCode==13)
			$confirmAddButton.click();
	})
	$confirmAddDiv.append($confirmAddButton);

	$addPrompt.append($cancelButtonDiv, $addNameDiv, $addQuantityDiv, $addCostDiv, $confirmAddDiv);
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

function editButtonDiv(coin){
	var $editButtonContainer = $("<td>").attr("class", "editButton");
	var $editButton = $("<input>").attr("value", "[Edit]").attr("type", "button");
	$editButton.click(function(){
		added.forEach(function(addedCoin){
			if(addedCoin.tag==coin.tag){
				var $addPrompt = addPrompt();
				var coinName = addedCoin.name;
				var fullTag = addedCoin.tag;
				var $cancelButtonDiv = cancelButtonDiv();
				var tags = fullTag.split("-");
				var baseTag = tags[0];
				var coinTag = tags[1];
				
				var $addNameDiv = $("<div>").text(coinName).attr("class", "addNameContainer");
				var $confirmAddButton = confirmEditButton("Update", fullTag, coinName, $cancelButtonDiv);
				$addPrompt.keyup(function(event){
					if(event.keyCode==13)
						$confirmAddButton.click();
				})
				var $confirmAddDiv = $("<div>").attr("class","confirmAddContainer");
				$confirmAddDiv.append($confirmAddButton);
				$addPrompt.append($cancelButtonDiv, $addNameDiv, addEditQuantityDiv(addedCoin.quantity, coinTag),
									addEditCostDiv(addedCoin.cost, baseTag),  $confirmAddDiv);
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
	var change = (((getCurrentPrice(coin) * coin.quantity)/(coin.cost*coin.quantity)) * 100)-100;
	change=change.toFixed(3);
	var indicator = (change>=0)?"▲ ":"▼ ";
	var $changeContainer = $("<td>").attr("class","portfolioChange").text(indicator+change+"%");
	var color = (change>=0)?"#99ff66":"#ff9999";
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
	var $currentPriceCell = currentPrice(coin);
	var $changeCell = priceChange(coin);
	var $deleteCell = deleteButton(coin);
	$portfolioLi.append($editButtonCell, $coinImageCell, $nameAndTag,
						$amountCell, $currentPriceCell, $changeCell, 
						$deleteCell);
	$("#portfolio").append($portfolioLi);
}

function portfolioMsg(msg){
	$portfolioDiv.empty();
	var $msg = $("<div>").attr("class", "msg").text(msg);
	$portfolioDiv.append($msg);
}

function RefreshButton(){
	var $refreshButton = $("<input>").attr("type", "image")
						.attr("id", "refreshButton").attr("src", "./images/refresh.png");
	$refreshButton.click(function(){
		if(!summariesLoading)
			refreshSummaries();
	});
	return $refreshButton;
}




function portfolioHead(){
	var $headRow = $("<tr>").attr("class", "portfolioHead");
	var headEls = new Array(7);
	var descriptorsAndText = [["edit",""], ["image",""], ["name","Name"],
							  ["quantity","Quantity"], 
							  ["currentPrice", "Current Price"],
							  ["change","Percent Change"],["delete",""]];
	for(var i=0; i<headEls.length;i++){
		descriptorsAndText[i][0]+="Head";
		headEls[i]=$("<th>");
		headEls[i].attr("class", descriptorsAndText[i][0]);
		headEls[i].text(descriptorsAndText[i][1]);
		if(descriptorsAndText[i][0]=="deleteHead"){
			var $refreshButton = RefreshButton();
			headEls[i].append($refreshButton);
		}
		$headRow.append(headEls[i]);
	}
	return $headRow;
}

function updateHeader(){
	$(".headerTotal").empty();
	let total = 0;
	for(let i = 0; i < added.length; i++){
		let t = getCurrentPrice(added[i]) * added[i].quantity;
		let b = (added[i].tag).split("-")[0];
		if(b != "BTC"){
			let priceInBTC = (marketSummaries.filter((m)=>m.MarketName==("BTC-"+b)))[0].Last;
			t *= priceInBTC;
		}
		total+=t;
	}
	let usdTotal = (marketSummaries.filter((m)=>m.MarketName==("USD-BTC")))[0].Last * total;
	let ethTotal = total / (marketSummaries.filter((m)=>m.MarketName==("BTC-ETH")))[0].Last;
	$btcTotalPara = $("<p>").text(total.toFixed(8)+" BTC");
	$ethTotalPara = $("<p>").text(ethTotal.toFixed(8)+" ETH");
	$usdTotalPara = $("<p>").text("$"+usdTotal.toFixed(2));
	$(".headerTotal").append($btcTotalPara, $ethTotalPara, $usdTotalPara);
}

function updatePortfolio(){
	updateHeader();
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
	this.count = 20;
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
			//ctx.fillStyle = 'slateblue';
		    //ctx.fillRect(0,0,tickerEl.width,tickerEl.height);
		    ctx.clearRect(0, 0, tickerEl.width, tickerEl.height);
			for(var i = 0; i<this.count; i++){
				ctx.fillStyle = 'white';
				ctx.font = '10px \'Press Start 2P\'';
				if(i+this.incrementers[i] == marketSummaries.length)
					this.incrementers[i]=-i;
				var current = marketSummaries[i+this.incrementers[i]];
				var name = current['MarketName'];
				ctx.fillText(name+" ", i*this.elWidth-this.offset+5,23);
				var change = (current['Last']/current['PrevDay'])*100-100;
				ctx.fillStyle = (change==0)?"#ffffff":(change>=0)?"#99ff66":"#ff9999";
				ctx.font = ('9px \'Press Start 2P\'');
				ctx.fillText(current['Last'].toFixed(8)+"("+change.toFixed(3)+"%)", 
							i*this.elWidth-this.offset+name.length*12, 22);
				
			}
			this.offset+=1;
	}
	this.updateSize = function(){
		tickerEl.width=(window.innerWidth>970)?window.innerWidth:970;

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
window.onresize = ticker1.updateSize;

function LoadBoxes(){
	var canvas = document.createElement('canvas');
	canvas.height = canvas.width = 20;
	canvas.setAttribute("class", "loadBoxes");
	const loadctx = canvas.getContext('2d');
	var loopCount = 0;
	function loadBoxLoop(){
	  //loadctx.fillStyle='#a6a6a6';
	  //loadctx.fillRect(0,0,20,20);
	  for (let i = 0; i < 3; i++){
	    loadctx.fillStyle='black';
	    if(Math.floor(loopCount/10)==i)
	      loadctx.fillStyle='gray';
	    loadctx.fillRect(i*8, 8, 4, 4);
	  }
	  loopCount=(loopCount==29)?1:loopCount+=1;
	  requestAnimationFrame(loadBoxLoop);
	}

	loadBoxLoop();
	return canvas;
}

function refreshSummaries(){
	summariesLoading = true;
	var refreshButton = $("#refreshButton");
	refreshButton.remove();
	var loadBoxes = LoadBoxes();
	let $delHead = $(".deleteHead");
	$delHead.empty();
	$delHead.append(loadBoxes);
	fetch(marketSummariesURL).then(function(response){
		response.text().then(function(text){
			marketSummaries = JSON.parse(text);
			marketSummaries = marketSummaries.result;
			summariesLoading = false;
			let $delHead = $(".deleteHead");
			$delHead.empty();
			let $refreshButton = RefreshButton();
			$delHead.append($refreshButton);
			updatePortfolio();
		})
	});
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
