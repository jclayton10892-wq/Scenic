# Scenic Roots Quoter – MASTER Build

Upload these files to your repo root. Includes:
- Profitable Catalog baked in
- Rate plans + override discounts
- Calculators (yards/tons)
- Profit Analyzer + KPI bar
- Crew Templates (set blended rate)
- Equipment Rentals quick-add
- Multi-Option proposals (Basic/Target/Premium)
- Payment QR (enter any checkout URL)
- Branding (logo + theme color)
- Photos + Annotations + Signature
- PWA offline (installable)

Deploy via GitHub Pages (main, root). Hard refresh after first load.


## Google Sheet Sync (optional)
This app can POST each quote to a Google Sheet via an **Apps Script Web App**.

### One-time setup
1. Create a new Google Sheet (name it anything).
2. Extensions → Apps Script. Paste this code:

```javascript
function doPost(e){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Quotes') || ss.insertSheet('Quotes');
  var data = JSON.parse(e.postData.contents);
  // Header
  if(sheet.getLastRow() === 0){
    sheet.appendRow(['Timestamp','Client','Job','Address','Prepared By','Rate Plan','Discount','Deposit','Overhead %','Profit %','Tax %','Tax Base','Selected Option','Investment Lines JSON','Lines JSON']);
  }
  sheet.appendRow([
    new Date(),
    data.client||'',
    data.job_name||'',
    data.address||'',
    data.prepared_by||'',
    data.rate_plan||'',
    data.discount||'',
    data.deposit||'',
    data.overhead_pct||'',
    data.profit_target_pct||'',
    data.tax_rate_pct||'',
    data.tax_base||'',
    data.selected_option||'',
    JSON.stringify(data.investment_lines||[]),
    JSON.stringify(data.lines||[])
  ]);
  return ContentService.createTextOutput('OK');
}
```

3. Deploy → **Manage deployments** → **New deployment** → **Web app**  
   - Execute as: **Me**  
   - Access: **Anyone** (or Anyone with the link)  
   - Copy the **Web app URL** (ends with `/exec`).

4. In the app, paste that URL into **Sheet Sync URL**, then from the **Proposal** view click **Sync to Google Sheet**.

## Email & CSV
- **Email Quote** opens your mail app with pre-filled subject/body (totals included). Attach the CSV if you want.
- **Export CSV** downloads a line-item CSV for your records or spreadsheets.


### Email via Apps Script (PDF attachment)
Use the same Web App URL as Sheet Sync. Replace your script with this version if you want emails with a PDF attachment:

```javascript
function doPost(e){
  var data = JSON.parse(e.postData.contents);
  if(data.action === 'email'){
    return sendEmailWithPdf_(data);
  } else {
    return appendToSheet_(data);
  }
}

function appendToSheet_(data){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Quotes') || ss.insertSheet('Quotes');
  if(sheet.getLastRow() === 0){
    sheet.appendRow(['Timestamp','Quote #','Status','Client','Job','Address','Prepared By','Rate Plan','Discount','Deposit','Overhead %','Profit %','Tax %','Tax Base','Selected Option','Investment Lines JSON','Lines JSON']);
  }
  sheet.appendRow([
    new Date(),
    data.quote_no||'',
    data.status||'',
    data.client||'',
    data.job_name||'',
    data.address||'',
    data.prepared_by||'',
    data.rate_plan||'',
    data.discount||'',
    data.deposit||'',
    data.overhead_pct||'',
    data.profit_target_pct||'',
    data.tax_rate_pct||'',
    data.tax_base||'',
    data.selected_option||'',
    JSON.stringify(data.investment_lines||[]),
    JSON.stringify(data.lines||[])
  ]);
  return ContentService.createTextOutput('OK');
}

function sendEmailWithPdf_(data){
  var html = HtmlService.createHtmlOutput(renderHtml_(data)).getContent();
  var blob = Utilities.newBlob(html, 'text/html', 'quote.html');
  // Build a simple summary PDF (Docs as a bridge)
  var sumDoc = DocumentApp.create('Quote_Summary_'+(data.quote_no||''));
  var body = sumDoc.getBody();
  body.appendParagraph('Quote #'+(data.quote_no||''));
  body.appendParagraph('Client: '+(data.client||''));
  body.appendParagraph('Job: '+(data.job_name||''));
  body.appendParagraph('Address: '+(data.address||''));
  body.appendParagraph('Status: '+(data.status||''));
  body.appendParagraph('Selected Option: '+(data.selected_option||''));
  body.appendParagraph('--- Investment ---');
  (data.investment_lines||[]).forEach(function(line){ body.appendParagraph(line); });
  sumDoc.saveAndClose();
  var pdf = DriveApp.getFileById(sumDoc.getId()).getAs('application/pdf').setName('Quote_'+(data.quote_no||'')+'.pdf');

  var to = data.to || Session.getActiveUser().getEmail();
  var subject = 'Estimate '+(data.quote_no||'')+': '+(data.client||'')+' – '+(data.job_name||'');
  var bodyText = 'Hi '+(data.client||'Client')+',\n\nPlease find your estimate attached.\n\nRegards,\n'+(data.prepared_by||'')+' ('+(data.business||'')+')';
  GmailApp.sendEmail(to, subject, bodyText, {attachments:[pdf, blob]});
  DriveApp.getFileById(sumDoc.getId()).setTrashed(true);
  return ContentService.createTextOutput('SENT');
}

function renderHtml_(data){
  var h = [];
  h.push('<h1>Quote #'+(data.quote_no||'')+'</h1>');
  h.push('<div><b>Client:</b> '+(data.client||'')+'</div>');
  h.push('<div><b>Job:</b> '+(data.job_name||'')+'</div>');
  h.push('<div><b>Address:</b> '+(data.address||'')+'</div>');
  h.push('<div><b>Prepared by:</b> '+(data.prepared_by||'')+'</div>');
  h.push('<div><b>Status:</b> '+(data.status||'')+'</div>');
  h.push('<div><b>Selected Option:</b> '+(data.selected_option||'')+'</div>');
  h.push('<h2>Investment</h2>');
  (data.investment_lines||[]).forEach(function(line){ h.push('<div>'+line+'</div>'); });
  h.push('<h2>Lines</h2>');
  (data.lines||[]).forEach(function(L){ h.push('<div>'+[L.idx,L.desc,L.unit,L.qty,L.unit_cost,L.crew_hrs,L.rate,L.equip,L.taxable,L.line_total].join(' | ')+'</div>'); });
  return h.join('');
}
```

> This keeps everything serverless (no external services) and attaches a simple PDF + the full HTML for recordkeeping.
