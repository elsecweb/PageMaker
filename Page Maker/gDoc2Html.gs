function ConvertGoogleDocToCleanHtml(body) {
  var numChildren = body.getNumChildren();
  var output = [];
  var listCounters = {};

  // Walk through all the child elements of the body.
  for (var i = 0; i < numChildren; i++) {
    var child = body.getChild(i);
    output.push(processItem(child, listCounters));
  }

  var html = output.join('\r');

  return html;
}

function processItem(item, listCounters) {
  var output = [];
  var prefix = "", suffix = "";
  
  if (item.getType() == DocumentApp.ElementType.PARAGRAPH) {
    switch (item.getHeading()) {
        // Add a # for each heading level. No break, so we accumulate the right number.
      case DocumentApp.ParagraphHeading.HEADING6: 
        prefix = "<h6>"+prefix, suffix += "</h6>"; break;
      case DocumentApp.ParagraphHeading.HEADING5: 
        prefix = "<h5>"+prefix, suffix += "</h5>"; break;
      case DocumentApp.ParagraphHeading.HEADING4:
        prefix = "<h4>"+prefix, suffix += "</h4>"; break;
      case DocumentApp.ParagraphHeading.HEADING3:
        prefix = "<h3>"+prefix, suffix += "</h3>"; break;
      case DocumentApp.ParagraphHeading.HEADING2:
        prefix = "<h2>"+prefix, suffix += "</h2>"; break;
      case DocumentApp.ParagraphHeading.HEADING1:
        prefix = "<h1>"+prefix, suffix += "</h1>"; break;
      default:
        // check if it's an html element (starts with '<')
        if (item.getText()[0] == '<') {
              // Pass
        }
        else {
          prefix = "<p>"+prefix, suffix += "</p>";
        }
    }

    if (item.getNumChildren() == 0) {
      return "";
    }
    if (item.getChild(0) && (item.getChild(0).getType() == DocumentApp.ElementType.HORIZONTAL_RULE)) {
      return "<hr>";
    }
  }
  else if (item.getType() == DocumentApp.ElementType.INLINE_IMAGE)
  {
    processImage(item, output);
  }
  else if (item.getType()===DocumentApp.ElementType.LIST_ITEM) {
    var listItem = item;
    var gt = listItem.getGlyphType();    
    var nl = listItem.getNestingLevel();
    var key = listItem.getListId();
    var prevNl = listCounters[key];
  
    // Determine list tag types by glyph
    var oTag;
    var cTag;
    if (isOrderedGlyph(gt)) {
      oTag = '<ol>';
      cTag = '</ol>';
    } else {
      oTag = '<ul>';
      cTag = '</ul>';
    }

    // First time seeing list
    if(prevNl == undefined) {
      prefix += oTag;
    } 
    // Increasing indent
    else if(prevNl < nl) {
      prefix += oTag;
    } 
    // Decreasing indent   
    else if(prevNl > nl) {
      prefix += cTag ;
      
    }
    prefix += "<li>";
    suffix += "</li>";
    
    // End of document, or list; if the next item is non-list but same indent level, don't end list
    if (item.isAtDocumentEnd() || 
        (item.getNextSibling() && ((item.getNextSibling().getType() != DocumentApp.ElementType.LIST_ITEM) &&
                                   (item.getAttributes()['INDENT_START'] != item.getNextSibling().getAttributes()['INDENT_START'])))) {
      // End of the list, close all nests
      for (var i=nl; i>=0; i--) {
        if (i) {
          suffix += cTag + "</li>";
        }
        else {
          suffix += cTag;
        }
      }      
    }                              
    listCounters[key] = nl;
  }    
  // Basic Table handling
  else if (item.getType()===DocumentApp.ElementType.TABLE) {
    prefix = "<table class='table table-striped table-hover'>";
    suffix = "</table>";
  }
  else if (item.getType()===DocumentApp.ElementType.TABLE_ROW) {
    prefix = "<tr>";
    suffix = "</tr>";
  }
  else if (item.getType()===DocumentApp.ElementType.TABLE_CELL) {
    prefix = "<td>";
    suffix = "</td>";
  }


  output.push(prefix);

  if (item.getType() == DocumentApp.ElementType.TEXT) {
    processText(item, output);
  }
  else {


    if (item.getNumChildren) {
      var numChildren = item.getNumChildren();

      // Walk through child elements of this item
      for (var i = 0; i < numChildren; i++) {
        var child = item.getChild(i);
        output.push(processItem(child, listCounters));
      }
    }

  }

  output.push(suffix);
  return output.join('');
}


function processText(item, output) {
  var text = item.getText();
  var indices = item.getTextAttributeIndices();

  for (var i=0; i < indices.length; i ++) {
    var partAtts = item.getAttributes(indices[i]);
    var startPos = indices[i];
    var endPos = i+1 < indices.length ? indices[i+1]: text.length;
    var partText = text.substring(startPos, endPos);
    
    if (partAtts.ITALIC) {
      output.push('<i>');
    }
    if (partAtts.BOLD) {
      output.push('<strong>');
    }
    if (partAtts.UNDERLINE) {
      output.push('<u>');
    }
    if (partAtts.LINK_URL) {
      output.push("<a href='" + item.getLinkUrl(indices[i]) + "'>");
    }
    
    output.push(partText);
    
    if (partAtts.ITALIC) {
      output.push('</i>');
    }
    if (partAtts.BOLD) {
      output.push('</strong>');
    }
    if (partAtts.UNDERLINE) {
      output.push('</u>');
    }
    if (partAtts.LINK_URL) {
      output.push('</a>');
    }
  }
}

function isOrderedGlyph(gt) {
  if (gt === DocumentApp.GlyphType.BULLET ||
      gt === DocumentApp.GlyphType.HOLLOW_BULLET ||
      gt === DocumentApp.GlyphType.SQUARE_BULLET) {
    return false
  } else {
    return true;
  }
}

// Doesn't really work like an html image
// If an image is inserted, it must also be linked to the image.
// in essenge, the image in the googel doc is used to trigger an html
// <img> tag, while the src is obtained from the linkUrl
function processImage(item, output) {
  var url = item.getLinkUrl();
  output.push('<img src="'+url+'" />');
}