 var output = '';

// children folders make up the side nav hierarchy
var children = [];
// grandChildren folders make up the tab nav hierachy
var grandChildren = [];
// greatGrandChildren are files, and make up page content
var greatGrandChildren = [];

function doGet(e) {
  var root = e.parameter.root;    
  
  if (root) {
    root = DriveApp.getFolderById(root);
  
    output += buildRoot(root);
  } else {
    output += "Please specify a root directory";
  }
  
  return ContentService.createTextOutput(output);
}

// Given a parent folder, generates html from a specific subfolder/file structure
function buildRoot(parent) {
  var s = '';
  var folders = parent.getFolders();

  // Put folders into array so they can be sorted
  while(folders.hasNext()) {
    var folder = folders.next();
    children.push([folder, folder.getName()]);    
  }
  // Sort
  children = children.sort(tupleSort);  
    
  s += beginPage(); 
  
  s += buildSideNav(children);
  
  // build main content area
  s += buildSideNavContent(children);
  
  s += endPage();
  
  // for scripts
  s += getFolderContents(parent);
  
  return s;
}

function buildSideNavContent(c) {
  var s = '';
  s += '<div class="span9">';
  s += '<div class="tab-content">';
  
  Logger.log("passed " + c.length + " children");
  
  // Loop through all children folders
  for (var i=0; i<c.length; i++) {
    if (i == 0) {
      var n = i+1;
      s += '<div id="tab' + n + '" class="tab-pane active">';
    }
    else {
      var n = i+1;
      s += '<div id="tab' + n + '" class="tab-pane">';
    }
    // Get child of current child (aka roots grandchild)
    grandChildren = [];
    var folders = c[i][0].getFolders();    

    // Put folders into array so they can be sorted
    while(folders.hasNext()) {
      var folder = folders.next();
      grandChildren.push([folder, folder.getName()]);    
    }    
    
    Logger.log("child " + i + " has " + grandChildren.length + " children");
    
    // If there's only 1 grandchild, no need for tabs
    if (grandChildren.length == 1) {
      s += getFolderContents(grandChildren[0][0]);   
      s += "</div>";
    } else {    
      // Sort
      grandChildren = grandChildren.sort(tupleSort);  
      // Get tab content      
      s += buildTabNav(grandChildren, i);
      s += buildTabPage(grandChildren, i);
      s += "</div>";      
    }
  }
  s += "</div>";
  s += "</div>";
  return s;
}

function buildTabNav(c, j) {
  var s = '';
  s += '<ul class="nav nav-tabs">';           
  
  for (var i=0; i<c.length; i++) {
    if (i == 0) {
      var n = i+1;
      var m = j+1;
      s += '<li class="active"><a href="#tab' + m + 'SubTab' + n + '" data-toggle="tab">';
      s += parseName(c[i][1]);
      s += '</a></li>';
    }
    else {
      var n = i+1;
      var m = j+1;    
      s += '<li><a href="#tab' + m + 'SubTab' + n + '" data-toggle="tab">';
      s += parseName(c[i][1]);
      s += '</a></li>';      
    }    
  }
  s += '</ul>';
  
  return s;
}

function buildTabPage(c, j) {
  var s = '';
  
  s += '<div class="tab-content">';
  for (var i=0; i<c.length; i++) {
    if (i == 0) {
      var n = i+1;
      var m = j+1;    
      s += '<div id="tab' + m + 'SubTab' + n + '" class="tab-pane active">';
    }
    else {
      var n = i+1;
      var m = j+1;
      s += '<div id="tab' + m + 'SubTab' + n + '" class="tab-pane">';
    }
    // Get tab content
    s += getFolderContents(c[i][0]);
    s += "</div>";
  }
  s += "</div>";
  return s;
}


function buildSideNav(c) {
  var s = '';
  s += '<div class="span3">';
  s += '<ul class="nav nav-tabs nav-stacked">';
  for (var i=0; i<c.length; i++) {
    if (i == 0) {
      var n = i+1;
      s += '<li class="active"><a href="#tab' + n + '" data-toggle="tab">';
      s += parseName(c[i][1]);
      s += '</a></li>';
    }
    else {
      var n = i+1;
      s += '<li><a href="#tab' + n + '" data-toggle="tab">';
      s += parseName(c[i][1]);
      s += '</a></li>';      
    }    
  }
  s += '</ul>';
  s += '</div>';
  
  return s;
}


// Given a file f, returns its string representation
function getContent(f) {
  // Get children of this 
  if (f.getMimeType() == "application/vnd.google-apps.document") {
    f = DocumentApp.openById(f.getId()).getBody();
    var s = ConvertGoogleDocToCleanHtml(f);
  } else {
    var s = f.getBlob().getDataAsString();
  }

  return s;
}

// Given a folder f, loops through all contained files, sorts, and calls getContent, 
// returns the concatenated string.
function getFolderContents(f) {
  var files = f.getFiles();
  var s = '';  
  greatGrandChildren = [];
  
  while(files.hasNext()) {
    var file = files.next();
    greatGrandChildren.push([file, file.getName()]);    
  }
  
  // Sort
  greatGrandChildren = greatGrandChildren.sort(tupleSort);  
  
  for(var i=0; i<greatGrandChildren.length; i++) {
    var file = greatGrandChildren[i][0];
    s += getContent(file);
  }
  return s;
}

function beginPage(){
  var s = '<div class="tabbable">';
  s+= '<div class="row-fluid">';
  return s;
}

function endPage() {
  var s = "</div>";
  s += "</div>";
  return s;
}

function parseName(file) {
  var s = '';
  s = file.slice(2);
  return s;
}

function tupleSort(a, b) {
   if (a[1] < b[1]) return -1;
   if (a[1] > b[1]) return 1;
   return 0;
}