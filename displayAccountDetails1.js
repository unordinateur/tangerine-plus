var strings = stringsAll.displayAccountDetails1;

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
}

function listEmailTransfers(pageData){
  var out = new Array();
  
  var transactionsDiv = pageData.find(".account-details-history > :not(#nsfDetailDiv)");  
  var trs = transactionsDiv.find("tbody tr");

  trs.each(function(){
    var transTds = $(this).find("td");
    if(transTds[2].innerText == strings.transfertCourriel){
      var transCell = transTds[1];
      var link = $(transCell).find("a");
      
      if(link.length == 1){
        out.push({
          amount: parseAmount(transTds[3].innerText),
          cell: transCell,
          href: link[0].href
        });
      }
    }
  });
  
  return(out);
}

function forEachTransaction(transfers,funct,done){
  if(done == undefined) done = function(){};
  
  function looper(i){
    if(i>=transfers.length){
      done(false);
      return;
    }
    
    var curTransfer = transfers[i];
    
    getEmailTransferDetails(curTransfer.href, function(data){
      if(funct(curTransfer,data)){
        looper(i+1);
      }else{
        done(true);   
      }  
    });
  }
  
  looper(0);
};

function forEachTransactionMultiPage(startURL,funct,done){
  if(done == undefined) done = function(){};
  
  function looper(curURL){
    $.get(curURL).done(function(data){
      var curPageData = $(data);
      
      forEachTransaction(listEmailTransfers(curPageData),function(transfer,details){
        return funct(curURL,transfer,details);
      },function(hasAbort){
        if(hasAbort){
          done(true);
        }else{
          var nextURL = curPageData.find("[data-nextdataset]").attr("data-nextdataset");

          if(nextURL){
            looper(nextURL);
          }else{
            done(false);
          }              
        }
      });
    });
  };   
    
  looper(startURL);
};

function getEmailTransferDetails(href, done){
	$.get(href).done(function(){
    $.get("https://secure.tangerine.ca/web/Tangerine.html?command=displayEmailMoneyTransferDetails").done(function(data){
      var detailsTds = $(data).find(".content-main-wrapper tbody td");
      
      var nameText = detailsTds[7].innerText;
      var parOpenI = nameText.indexOf("(");
      var parCloseI = nameText.indexOf(")");
      
      var dateSent = detailsTds[9].innerText.split("/");
      var dateExpire = detailsTds[11].innerText.split("/");
      
      done({
        amount: parseAmount(detailsTds[1].innerText),
        type: detailsTds[3].innerText,
        account: detailsTds[5].innerText,
        to: nameText,
        toName: nameText.substring(0,parOpenI-1),
        toEmail: nameText.substring(parOpenI+1,parCloseI),
        dateSent: new Date(dateSent[2],dateSent[1]-1,dateSent[0]),
        dateExpire: new Date(dateExpire[2],dateExpire[1]-1,dateExpire[0]),
        status: detailsTds[13].innerText,
        idNumber: detailsTds[15].innerText
      });
    });
  });
}

function displayRegular(){
  function formatDetails(href, name, status){
    return("<a href='"+href+"'>"+strings.transfertCourrielTangerine+"</a><br>" +
          strings.toa+": " + name + "<br>" +
          strings.status+": " + status)
  }

  $("<a href='https://secure.tangerine.ca/web/Tangerine.html?command=displayAccountDetails&showPendingEmails=1'>").text(strings.voirAttente).appendTo(".account-details-account-actions")

  var transfers = listEmailTransfers($("body"));
  
  $.each(transfers,function(){
    this.cell.innerHTML = formatDetails(this.href, spinner, spinner);
  });
  
  forEachTransaction(transfers,function(transfer,details){
    transfer.cell.innerHTML = formatDetails(transfer.href, details.toName, statusString(details.status));
    return true;
  });
}

function displayPendingEmails(){
  function formatRow(header, href, idNumber, dateSent, dateExpire, name, amount){
    if(dateSent instanceof Date) dateSent = dateSent.getFullYear()+"-"+zeropad(dateSent.getMonth())+"-"+zeropad(dateSent.getDate());
    if(dateExpire instanceof Date) dateExpire = dateExpire.getFullYear()+"-"+zeropad(dateExpire.getMonth())+"-"+zeropad(dateExpire.getDate());
    if(href) idNumber = "<a href='"+href+"'>"+idNumber+"</a>";
    if((typeof amount)=="number") amount = formatArgent(amount);
    
    var celltype = "td";
    if(header) celltype = "th";
    
    var out = $("<tr>");
    out.append($("<"+celltype+" class='span2'>").append(idNumber));
    out.append($("<"+celltype+" class='span2'>").append(dateSent));   
    out.append($("<"+celltype+" class='span2'>").append(dateExpire));     
    out.append($("<"+celltype+" class='span5'>").append(name));       
    out.append($("<"+celltype+" class='span2 table-column-small text-right'>").append(amount));
    
    if(header) out = $("<thead>").append(out);
    
    return(out);
  }
  
  $("<a href='https://secure.tangerine.ca/web/Tangerine.html?command=displayAccountDetails'>").text(strings.voirHistorique).appendTo(".account-details-account-actions");
  
  $(".account-details-actions").html("<h3>"+strings.transfertAttente+"</h3>");
  $(".button-holder").remove();
  
  var table = $(".account-details-history table").empty();

  table.append(formatRow(true,"",strings.number,strings.dateEnvoi,strings.dateExpiration,strings.destinataire,strings.montant));

  var busyRow = $(formatRow(false,"", spinner, spinner, spinner, spinner, spinner)).appendTo(table);
  
  forEachTransactionMultiPage("https://secure.tangerine.ca/web/Tangerine.html?command=displayAccountDetails&txnType=EM&txnDateRange=L60D",function(pageUrl,transfer,details){
    if(transfer.amount<0){
      if(((today-details.dateSent)/1000/60/60/24) < 33){
        if(details.status == stringsAll.displayEmailMoneyTransferDetails.attente){
          busyRow.before(formatRow(false, pageUrl+"&gotoTransactionNo="+transfer.href.slice(-1), details.idNumber, details.dateSent, details.dateExpire, details.to, details.amount));
        }          
      }else{
        return false;
      }
    }
    return true;
  },function(hasAbort){
    busyRow.remove();  
  });
}

var gotoTransactionNo = getQueryVariable("gotoTransactionNo");

if((typeof gotoTransactionNo) != "undefined") window.location.replace("https://secure.tangerine.ca/web/Tangerine.html?command=gotoEmailMoneyTransferDetails&txnIndex="+gotoTransactionNo);
else if(getQueryVariable("showPendingEmails")==1) displayPendingEmails();
else displayRegular();



