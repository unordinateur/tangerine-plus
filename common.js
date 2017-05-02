function formatPercent(rate){
    return rate.toLocaleString(lang,{
        style: "percent",
        
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatArgent(amount){
    return amount.toLocaleString(lang,{
        style: "currency",
        currency: "CAD",
        
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).replace("CA","");
}

function zeropad(y){
    return ("0" + y).slice(-2);
}

function twodecimals(y){
    return y.toFixed(2);
}

function parseAmount(amountStr){
  var out;
  if(lang.indexOf("fr")>=0){
    out = parseFloat(amountStr.replace(',', '.').replace(' ', '').replace('$', ''));
  } else if(lang.indexOf("en")>=0){
    out = parseFloat(amountStr.replace(',', '').replace('$', ''));
  }
  
  return out;
}

var now = new Date();
var today = getDateAgo(0,0,0);

function parseDate(dateStr){
  var d, m, y;
  var n;
  
  if(dateStr.indexOf("/")>=0) n = dateStr.split("/");
  else if(dateStr.indexOf("-")>=0) n = dateStr.split("-");
  else throw "Date Malformée";
  
  var c = n[1].charAt(0);
  if(c >= '0' && c <= '9'){
    m = parseInt(n[1])-1;
  }
  else{
    var str = n[1].toLowerCase();
    m = -1;
    for(var i=0; i<stringsAll.common.monthsList.length; i++){
      if(str == stringsAll.common.monthsList[i]){
        m = i;
        break;
      }
    }
  }
  if(m < 0) throw "Date Malformée";
  
  if(n[0].length == 4){
    y = parseInt(n[0]);
    d = parseInt(n[2]);
  }else if(n[2].length == 4){
    y = parseInt(n[2]);
    d = parseInt(n[0]);    
  }else{
    throw "Date Malformée";
  }
  
  return new Date(Date.UTC(y,m,d));
}

function getDateAgo(dy,dm,dd,ref = now){
    return(new Date(Date.UTC(ref.getFullYear()-dy,ref.getMonth()-dm,ref.getDate()-dd)));
}

function statusString(inText){
  var strings = stringsAll.displayEmailMoneyTransferDetails;
  
  switch(inText){
    case strings.accepte:
    case strings.autoAccepte:
      inText += " <span style='color: #00DD00'>&#9679;</span>"
      break;
    case strings.attente:
      inText += " <span style='color: #FFDD00'>&#9650;</span>"
      break;
    case strings.nonReussi:
    case strings.annule:
    case strings.expire:
    case strings.refuse:
      inText += " <span style='color: #EE0000'>&#9632;</span>"
      break;
    default:
      break;
  }
  
  return(inText);
}