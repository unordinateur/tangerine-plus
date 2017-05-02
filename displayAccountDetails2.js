var pageDiv = $(".pagination");
var altPageDiv = $("<div class='pagination'>").insertAfter(pageDiv);
var altBaseUl = $("<ul>").appendTo(altPageDiv);
var groupePageDiv = $("<div class='pagination'>").insertAfter(altPageDiv);
var groupeBaseUl = $("<ul>").appendTo(groupePageDiv);

var prevURL = pageDiv.attr("data-prevdataset");
var nextURL = pageDiv.attr("data-nextdataset");

if(prevURL) $("<li><a title href='"+prevURL+"'><</a></li>").appendTo(altBaseUl);
if(nextURL) $("<li><a title href='"+nextURL+"'>></a></li>").appendTo(altBaseUl);

var grouping10 = $("<li><a title>10</a></li>").appendTo(groupeBaseUl).click(function(){
  $(".account-details-history tbody tr._hidden").removeClass("_hidden").addClass("hidden");
  
  pageDiv.removeClass("hidden");
  altPageDiv.addClass("hidden");
  
  grouping10.addClass("active");
  grouping50.removeClass("active");

  localStorage.setItem("itemsPerPage","10");
});
var grouping50 = $("<li><a title>50</a></li>").appendTo(groupeBaseUl).click(function(){
  $(".account-details-history tbody tr.hidden").removeClass("hidden").addClass("_hidden");
  
  pageDiv.addClass("hidden");  
  altPageDiv.removeClass("hidden");
  
  grouping10.removeClass("active");
  grouping50.addClass("active");
  
  localStorage.setItem("itemsPerPage","50");
});

switch(localStorage.getItem("itemsPerPage")){
  case "50":
    grouping50.click();
    break;
  default:
    grouping10.click();
}