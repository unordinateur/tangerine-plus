var strings = stringsAll.displayMutualFundAccount;

function Portefeuille(){
    this.transactionList = undefined;
    this.historicalValues = undefined;
    this.idPortefeuille = undefined;
    
    this.importTransactionList = function(arr){
        arr.push(new Transaction("1970-01-01","1970-01-01","ouverture","0","0"));
        
        arr.sort(function(a,b){
            return(a.dateAchat-b.dateAchat);
        });
        
        var firstTransaction = arr[0];
        firstTransaction.unitesTotale=0;
        firstTransaction.montantDeposeTotal=0;
        firstTransaction.montantRetireTotal=0;
        
        var lastTransaction = firstTransaction;
        
        for(var i=1; i<arr.length; i++){
            var curTransaction = arr[i];
            
            curTransaction.unitesTotale = curTransaction.nombreUnites + lastTransaction.unitesTotale;
            
            curTransaction.montantDeposeTotal = lastTransaction.montantDeposeTotal;
            curTransaction.montantRetireTotal = lastTransaction.montantRetireTotal;
            
            switch(curTransaction.typeTransaction){
                case "achat":
                    curTransaction.montantDeposeTotal += curTransaction.montantInvesti;
                    break;
                case "vente":
                    curTransaction.montantRetireTotal -= curTransaction.montantInvesti;
                    break;
            }
            
            lastTransaction = curTransaction;
        }  
        
        this.transactionList = arr;
    }
    
    this.importHistoricalValues = function(arr){
        arr.push(new ValeurHistorique("1970-01-01","0"));
        
        arr.sort(function(a,b){
            return(a.date-b.date);
        });
        
        this.historicalValues = arr;
    }
    
    this.setPortefeuilleID=function(name){
        name=name.toLowerCase();
        
        if(name.indexOf(strings.equilibre)>=0){
            if(name.indexOf(strings.revenu)>=0){
            	this.idPortefeuille = "INI210";
        	}else if(name.indexOf(strings.croissance)>=0){
            	this.idPortefeuille = "INI230";
        	}else{
            	this.idPortefeuille = "INI220";
        	}    
        }else if((name.indexOf(strings.action)>=0) && (name.indexOf(strings.croissance)>=0)){
            this.idPortefeuille = "INI240";
        }else if(name.indexOf(strings.dividendes)>=0){
            this.idPortefeuille = "INI235";          
        }
    }
    
    this.lastestTransactionIdxOn=function(targetDate){
        for(var i=0;i<this.transactionList.length;i++){
            if(targetDate<this.transactionList[i].dateAchat){
                return(i-1);
            }
        }
        return(this.transactionList.length-1);
    }
    
    this.lastestUnitValueIdxOn=function(targetDate){
        for(var i=0;i<this.historicalValues.length;i++){
            if(targetDate<this.historicalValues[i].date){
                return(i-1);
            }
        }
        return(this.historicalValues.length-1);        
    }
    
    this.unitValueOn=function(targetDate){
        return(this.historicalValues[this.lastestUnitValueIdxOn(targetDate)].valeur);
    }
    
    
    this.totalDepositOn=function(targetDate){
        return(this.transactionList[this.lastestTransactionIdxOn(targetDate)].montantDeposeTotal);
    }
    
    this.totalWithdrawalsOn=function(targetDate){
        return(this.transactionList[this.lastestTransactionIdxOn(targetDate)].montantRetireTotal);
    }
        
    this.totalInvestedOn=function(targetDate){
        return(this.totalDepositOn(targetDate)-this.totalWithdrawalsOn(targetDate));
    }
    
    this.numUnitsOn=function(targetDate){
        return(this.transactionList[this.lastestTransactionIdxOn(targetDate)].unitesTotale);
    }
    
    this.totalValueOn=function(targetDate){
        return(this.unitValueOn(targetDate)*this.numUnitsOn(targetDate));
    }
    
    this.getTransactionsBetween = function(debut,fin){
        return(this.transactionList.slice(this.lastestTransactionIdxOn(debut)+1, this.lastestTransactionIdxOn(fin)+1));
    }
    
    this.getFirstTransaction = function(){
        return(this.transactionList[1]);
    }
    
    this.getRendementTotalEntre = function(debut,fin){
        var valeurDebut = this.totalValueOn(debut);
        var valeurFin = this.totalValueOn(fin);
        var investissementEntre = this.totalInvestedOn(fin)-this.totalInvestedOn(debut);
        
        return(valeurFin/(valeurDebut+investissementEntre)-1);
    }
    
    this.getRendementReelEntre = function(debut,fin){
        var msPerYear = 24*60*60*1000*365.2425;
        
        var valeurDebut = this.totalValueOn(debut);
        var valeurFin = this.totalValueOn(fin);
        
        var inbetweenTransactions = this.getTransactionsBetween(debut,fin);
        
        var rate = 0.1;
        var diffrate = 0;
        
        //On veut que [sum montant_investi*taux^durée] = valeurFin, donc que [sum montant_investi*taux^durée] - valeurFin=0.
        //Utilisons la méthode de Newton.
        
        //f= sum[montant_investi*taux^durée] - valeurFin. Alors on veut f=0.
        var f = function(inrate){
            
            var base = inrate+1;
            var dur = (fin-debut)/msPerYear;
            
            var valfin = valeurDebut*Math.pow(base,dur);
            
            for(var i=0; i<inbetweenTransactions.length; i++){
                var curTransaction = inbetweenTransactions[i];               
                
                dur = (fin-curTransaction.dateAchat)/msPerYear;
                
                valfin += curTransaction.montantInvesti*Math.pow(base,dur);
            }
            
            return(valfin-valeurFin);
        }
        
        //La dérivée de f.
        var diff_f = function(inrate){
            var base = inrate+1;
            var dur = (fin-debut)/msPerYear;
            
            var valfin = valeurDebut*dur*Math.pow(base,dur-1);
            
            for(var i=0; i<inbetweenTransactions.length; i++){
                var curTransaction = inbetweenTransactions[i]; 
                
                dur = (fin-curTransaction.dateAchat)/msPerYear; 
                
                valfin += curTransaction.montantInvesti*dur*Math.pow(base,dur-1);              
            }
            
            return(valfin);
        }
        
        var i = 0;
        
        do{
            if(i>100){
              rate=NaN;
              break;
            }            
            i++;
            
            diffrate = - f(rate)/diff_f(rate);
            rate+=diffrate;
        }while(Math.abs(diffrate)>1e-6);
        
        compoundingPerYear = 12;
        rate = compoundingPerYear*(Math.pow(1+rate,1/compoundingPerYear)-1);
        
        return(rate);
    }
    
}

function Transaction(date1, date2, type, nombre, montant){
    this.dateAchat = parseDate(date1);
    this.dateReglement = parseDate(date2);
    
    type = type.toLowerCase();
    
    if((type.indexOf(strings.achat)>=0) || (type.indexOf(strings.entrant)>=0)){
        this.typeTransaction = "achat";
    }else if((type.indexOf(strings.vente)>=0) || (type.indexOf(strings.sortant)>=0)){
        this.typeTransaction = "vente";
    }else if(type.indexOf(strings.dividende)>=0){
        this.typeTransaction = "dividende";
    }else{
        this.typeTransaction = undefined;        
    }
    
    this.nombreUnites = parseFloat(nombre);
    
    if(this.typeTransaction != "dividende"){
        this.montantInvesti = parseAmount(montant);
    }else{
        this.montantInvesti = 0;
    }
    
    this.unitesTotale = undefined;
    this.montantDeposeTotal = undefined;
    this.montantRetireTotal = undefined;
}

function ValeurHistorique(date, val){
    this.date = parseDate(date);
    this.valeur = parseFloat(val);
}

var curPortefeuille = new Portefeuille();

$.post("https://secure.tangerine.ca/web/Tangerine.html", "command=goToMFAccountTransactionPrt&TRANSTYPE=1&RECDATE=1%2F1%2F2008&EXPDATE="+now.getDate()+"%2F"+(now.getMonth()+1)+"%2F"+now.getFullYear()+"&"+strings.imprimer+"=").success(function(){
  
  $.get("https://secure.tangerine.ca/web/Tangerine.html?command=displayMFAccountTransactionPrt").success(function(data){
    var listRows = $(data).find("table+table>tbody>tr");

    var arr = new Array();
    
    listRows.each(function(){
      var listCols = this.childNodes;
      arr.push(new Transaction(listCols.item(1).textContent,listCols.item(2).textContent,listCols.item(4).textContent,listCols.item(5).textContent,listCols.item(7).textContent));
    });
    
    curPortefeuille.setPortefeuilleID(listRows.get(0).childNodes.item(3).textContent);
    curPortefeuille.importTransactionList(arr);
    
    $.getJSON("//api.morningstar.com/service/mf/Price/fundserv/"+curPortefeuille.idPortefeuille+"?format=json&username=morningstar&password=ForDebug&startdate=2008-01-01&enddate=2099-01-01", function(indata){
      var prices = indata.data.Prices;
      
      var arr = new Array();
      
      for(var i=0;i<prices.length;i++){
          var curPrice = prices[i];
          arr.push(new ValeurHistorique(curPrice.d,curPrice.v));
      }
      
      curPortefeuille.importHistoricalValues(arr);
      
      var date0     = parseDate("2008-01-01");
      var dateDebut = curPortefeuille.getFirstTransaction().dateAchat;
      
      var dateList = [
        getDateAgo(0,1,0,dateNow),
        getDateAgo(0,3,0,dateNow),
        getDateAgo(1,0,0,dateNow),
        getDateAgo(3,0,0,dateNow),
        getDateAgo(5,0,0,dateNow),
      ];
      
      for(var i=0; i<5; i++){
        var totCell = rowTotTds.eq(i+1);
        var yearlyCell = rowYearlyTds.eq(i+1);
        
        if(dateDebut <= dateList[i]){
          totCell.text(formatPercent(curPortefeuille.getRendementTotalEntre(dateList[i],dateNow)));
          yearlyCell.text(formatPercent(curPortefeuille.getRendementReelEntre(dateList[i],dateNow)));
        }else{
          totCell.text("-");
          yearlyCell.text("-");          
        }
      }
      
      rowTotTds.eq(6).text(formatPercent(curPortefeuille.getRendementTotalEntre(date0,dateNow)));
      rowYearlyTds.eq(6).text(formatPercent(curPortefeuille.getRendementReelEntre(date0,dateNow)));
      
      cellDeposits.text(formatArgent(curPortefeuille.totalDepositOn(dateNow)));
      cellWithdrawals.text(formatArgent(curPortefeuille.totalWithdrawalsOn(dateNow)));
    });
  });
});


var tables = $(".content-main-wrapper table");

var tableSummary = tables.eq(0);
$("<h3>").text(strings.sommaireCotisations).insertBefore(tableSummary);
tableSummary.find("th").eq(0).empty();

var tableSummaryBody = tableSummary.find("tbody");
var cellWithdrawals = $('<td>').html(spinner).appendTo($('<tr><td class="span10">'+ strings.retraitTotal +' '+strings.depuisOuverture+':</td>').prependTo(tableSummaryBody));
var cellDeposits = $('<td>').html(spinner).appendTo($('<tr><td class="span10">'+ strings.depotTotal +' '+strings.depuisOuverture+':</td>').prependTo(tableSummaryBody));

var tableValue = tables.eq(1);
$("<h3>").text(strings.valeur).insertBefore(tableValue);

var ths = tableValue.find("th");
var tds = tableValue.find("td");

var portefeuilleName = tds.eq(1).text();
ths.eq(0).addClass("span2").removeClass("span1");
tds.eq(6).attr("colspan","4");
ths.eq(1).remove();
tds.eq(1).remove();

var dateNow = parseDate(tableValue.find("td").eq(0).text());

var tableYeld = $('<table class="table table-striped table-mixed">').insertAfter(tableValue);
$("<hr>").insertBefore(tableYeld);
$("<h3>").text(strings.rendement).insertBefore(tableYeld);

var rowHead = $("<tr>").appendTo($("<thead>").appendTo(tableYeld));
var rowTot = $("<tr>").appendTo(tableYeld);
var rowYearly = $("<tr>").appendTo(tableYeld);

$('<th class="span2">').appendTo(rowHead);
$('<th class="span1">').text("1 "+strings.mois).appendTo(rowHead);
$('<th class="span1">').text("3 "+strings.moiss).appendTo(rowHead);
$('<th class="span1">').text("1 "+strings.an).appendTo(rowHead);
$('<th class="span1">').text("3 "+strings.ans).appendTo(rowHead);
$('<th class="span1">').text("5 "+strings.ans).appendTo(rowHead);
$('<th class="span2">').text(strings.depuisOuverture).appendTo(rowHead);

for(var i=0;i<7;i++){
  $('<td>').html(spinner).appendTo(rowTot);
  $('<td>').html(spinner).appendTo(rowYearly);
}

var rowTotTds = rowTot.children();
rowTotTds.eq(0).text(strings.rendTotal);

var rowYearlyTds = rowYearly.children();
rowYearlyTds.eq(0).text(strings.rendAnn);

var mainWrap = $(".content-main-wrapper");

mainWrap.find("#account-details p").html("<b>"+strings.nomPortefeuille+":</b> "+portefeuilleName);
mainWrap.find("hr ~ p")
  .after("<p>"+strings.explicationRendementTotal+"</p>")
  .after("<p>"+strings.explicationRendementAnnualise+"</p>");