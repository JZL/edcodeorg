// File: utilities.gas
// Description: 
// This file contains helper functions for a variety of purposes, as
// well as the functions.

// TODO_AJR - Create a Utils object for all these not called by Google.

// TODO_AJR - Lots of potentially private functions in here.

// Event Handlers
// ==============

// onInstall: 
// Gets called when script is first installed.
// Sets up menu (really just calls onOpen() ).
function onInstall(e)
{
  onOpen(e);  
  showNewVersionNotice();
}  

// onOpen:
// Gets called when the spreadsheet is opened.
// Sets up the menu and shows a notification.
function onOpen(e)
 {
   if (e && e.authMode == ScriptApp.AuthMode.NONE)
     {
       // Script is present in a sheet where it hasn't been used yet.
       // (added as an Add-On in a different sheet where it *was* used).
       // This is needed to ensure we don't try to read properties.
       createNonAuthMenu();
     }
   
   else
     {             
       createFlubarooMenu();
       
       // notify the user if autograde is enabled in this sheet.
       if (Autograde.isOn())
         {
           var ss = SpreadsheetApp.getActiveSpreadsheet();
           setNotification(ss, langstr("FLB_STR_NOTIFICATION"),
                    langstr("FLB_STR_AUTOGRADE_IS_ON"));
         }
     }
 }

function onEnable(e) 
{
  onOpen(e);
}
 
function toggleFeedback()
{
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var grades_sheet = getSheetWithGrades(ss);
  
  var dp = PropertiesService.getDocumentProperties();
  
  var num_stud_identifiers = Number(dp.getProperty(DOC_PROP_NUM_STUDENT_IDENTIFIERS));
  
  var metric_start_col = 2 + parseInt(num_stud_identifiers);
  var feedback_col_num =  metric_start_col + METRIC_STUDENT_FEEDBACK;
  var col_hidden = dp.getProperty(DOC_PROP_STUDENT_FEEDBACK_HIDDEN);
  
  if (col_hidden == "true")
    {
      ss.setActiveSheet(grades_sheet);
      grades_sheet.showColumns(feedback_col_num);
      var range = grades_sheet.getRange(gbl_grades_start_row_num + 1, feedback_col_num);
      grades_sheet.setActiveSelection(range);
      dp.setProperty(DOC_PROP_STUDENT_FEEDBACK_HIDDEN, "false");
    }
  else
    {
      grades_sheet.hideColumns(feedback_col_num);
      dp.setProperty(DOC_PROP_STUDENT_FEEDBACK_HIDDEN, "true");
    }
  
  createFlubarooMenu();
}

function helpTipsHidden()
{
  var dp = PropertiesService.getDocumentProperties();
  var ht_hidden = dp.getProperty(DOC_PROP_HELP_TIPS_HIDDEN);
  
  if (ht_hidden === null)
    {
      // handle first case when not set yet.
      ht_hidden = "true";
    }
  
  if (ht_hidden == "true")
    {
      return true;
    }
  else
    {
      return false;
    }
}

function toggleHelpTips()
{
  var dp = PropertiesService.getDocumentProperties();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var subm_sheet = getSheetWithSubmissions(ss);
  var tips_present = false;
  var set_active_cell = false;
  
  if (getTipsRow(subm_sheet) != null)
    {
      tips_present = true;
    }
  
  if (helpTipsHidden())
    {
      // unhide or insert Help Tips row
      ss.setActiveSheet(subm_sheet);
      dp.setProperty(DOC_PROP_HELP_TIPS_HIDDEN, "false");

      if (tips_present)
        {
          subm_sheet.showRows(2);
        }
      else
        {
          subm_sheet.insertRowAfter(1);
        }
      
      set_active_cell = true;
    }
  else
    {
      // hide it, if it exists
      if (tips_present)
        {
          subm_sheet.hideRows(2);
        }
      
      dp.setProperty(DOC_PROP_HELP_TIPS_HIDDEN, "true");
    }
  
  createFlubarooMenu();
  
  // TODO_DAA: somehow createFlubarooMenu is setting active cell to A1.
  // So for now, move setting of active range to below menu call.
  if (set_active_cell)
    {
      var range = subm_sheet.getRange("B2");
      subm_sheet.setActiveSelection(range);
    }
}

function showEmailQuota()
{
  var quota_remaining = MailApp.getRemainingDailyQuota();
  
  quota_remaining = Math.max(0, quota_remaining);
  
  UI.msgBox(langstr("FLB_STR_NOTIFICATION"),
            langstr("FLB_STR_EMAIL_QUOTA_MSG") + quota_remaining,
            Browser.Buttons.OK);
}

// Google Analytics Logging
// ========================

function createGATrackingUrl(encoded_page_name)
{
  var utmcc = createGACookie();
  
  if (utmcc == null)
    {
      return null;
    }
 
  var ga_url1 = "http://www.google-analytics.com/__utm.gif?utmwv=5.2.2&utmhn=www.flubaroo-analytics.com&utmcs=-&utmul=en-us&utmje=1&utmdt&utmr=0=";
  var ga_url2 = "&utmac=UA-22064161-3&utmcc=" + utmcc + "&utmu=DI~";
  var ga_url_full = ga_url1 + encoded_page_name + "&utmp=" + encoded_page_name + ga_url2;
  
  return ga_url_full;
}

function createGACookie()
{
  var a = "";
  var b = "100000000";
  var c = "200000000";
  var d = "";

  var dt = new Date();
  var ms = dt.getTime();
  var ms_str = ms.toString();
 
  var up = PropertiesService.getUserProperties();
  
  var flubaroo_uid = up.getProperty("flubaroo_uid");
  if ((flubaroo_uid == null) || (flubaroo_uid == ""))
    {
      // shouldn't happen unless user explicitly removed flubaroo_uid from properties,
      // or hasn't graded yet.
      return null;
    }
  
  a = flubaroo_uid.substring(0,9);
  d = flubaroo_uid.substring(9);
  
  utmcc = "__utma%3D451096098." + a + "." + b + "." + c + "." + d 
          + ".1%3B%2B__utmz%3D451096098." + d + ".1.1.utmcsr%3D(direct)%7Cutmccn%3D(direct)%7Cutmcmd%3D(none)%3B";
 
  return utmcc;
}

function logGrading(ss_name)
{
  if (ss_name.indexOf('Geography 10 - Quiz #2') == -1)
    {
      // probably not the "try it now" sample. so anonymously record that another
      // assignment was graded!
      var ga_url = createGATrackingUrl("Assignment%20Graded");
      if (ga_url)
        {
          var response = UrlFetchApp.fetch(ga_url);
        }
            
      // log grading for this specific version (to track fragmentation of versions)      
      var ga_url = createGATrackingUrl(encodeURIComponent(gbl_version_str));
      if (ga_url)
        {
          var response = UrlFetchApp.fetch(ga_url);
        }
      
    }
  else // sample assignment
    {
      var ga_url = createGATrackingUrl("Sample%20Graded");
      if (ga_url)
        {
          var response = UrlFetchApp.fetch(ga_url);
        }
    }
}

function logActiveUserGrading()
{
  var up = PropertiesService.getUserProperties(); 
  
  // track 30 day actives using month. to be counted as an active,
  // user, user must grade at least 1 assignment during the month.
  // we also check that the lifetime usage > 4, to filter out
  // people just playing around with or testing out Flubaroo.
  var track_month = up.getProperty(USER_PROP_GRADE_MONTH);
  var track_month_count = up.getProperty(USER_PROP_GRADE_MONTH_COUNT);
  var track_lifetime_count = up.getProperty(USER_PROP_GRADE_LIFETIME_COUNT);
      
  var d = new Date();
  var current_month = (d.getMonth() + 1).toString();
      
  // init if never setup
  if (track_month == null)
    {
      track_month = current_month;
    }
  if (track_month_count == null)
    {
      track_month_count = "0";
    }
  if (track_lifetime_count == null)
    {
      track_lifetime_count = "0";
    }
            
  if (current_month == track_month)
    {
      track_month_count = parseInt(track_month_count);
      track_month_count++;
      track_month_count = track_month_count.toString();
    }
  else
    {
      track_month = current_month;
      track_month_count = "1"; // start over
    }
  
  track_lifetime_count = parseInt(track_lifetime_count);
  track_lifetime_count++;
  track_lifetime_count = track_lifetime_count.toString();
      
  up.setProperty(USER_PROP_GRADE_MONTH, track_month);
  up.setProperty(USER_PROP_GRADE_MONTH_COUNT, track_month_count);
  up.setProperty(USER_PROP_GRADE_LIFETIME_COUNT, track_lifetime_count);
  
  // log once and only once per month
  if ((track_lifetime_count > 4) && (track_month_count == "1"))
    {  
      var ga_url = createGATrackingUrl("Active%20Monthly%20Users"); 
      if (ga_url)
        {
          var response = UrlFetchApp.fetch(ga_url);
        }
      
      // track if they have at least one sheet that uses autograde
      var active_ag_uses = up.getProperty(USER_PROP_AUTOGRADE_ACTIVE_USES);
      if ((active_ag_uses != null) && (Number(active_ag_uses) > 0))
        {
          ga_url = createGATrackingUrl("Active%20Monthly%20Autograde%20Users"); 
          if (ga_url)
            {
              var response = UrlFetchApp.fetch(ga_url);
            }
        }
    }
}

function logEmail()
{
  var ga_url = createGATrackingUrl("Emailed%20Grades");
  if (ga_url)
    {
      var response = UrlFetchApp.fetch(ga_url);
    }
}

function logAboutFlubaroo()
{
  var ga_url = createGATrackingUrl("About%20Flubaroo");
  if (ga_url)
    {
      var response = UrlFetchApp.fetch(ga_url);
    }
}

function logFirstInstall()
{
  var ga_url = createGATrackingUrl("First%20Install");
  if (ga_url)
    {
      var response = UrlFetchApp.fetch(ga_url);
    }
}

function logRepeatInstall()
{
  var ga_url = createGATrackingUrl("Repeat%20Install");
  if (ga_url)
    {
      var response = UrlFetchApp.fetch(ga_url);
    }
}

// setCurrentVersionInfo:
// Called just before grading occurs. So new version isn't set after install
// until after first grade.
function setCurrentVersionInfo()
{
  var dp = PropertiesService.getDocumentProperties();    

  var sver = dp.getProperty(DOC_PROP_SHEET_INSTALLED_VERSION);
  if ((sver == null) || (sver != gbl_version_str))
    {
      dp.setProperty(DOC_PROP_SHEET_INSTALLED_VERSION, gbl_version_str);
    }

  // take note of the latest version the user has installed across all sheets.
  // used to show user version update notice.
  var up = PropertiesService.getUserProperties();
  var uver = up.getProperty(USER_PROP_LATEST_VERSION_INSTALLED);
  if ((uver == null) || (uver != gbl_version_str))
    {
      up.setProperty(USER_PROP_LATEST_VERSION_INSTALLED, gbl_version_str);
    }
}

function setFlubarooUid()
{ 
  var up = PropertiesService.getUserProperties();
  var flubaroo_uid = up.getProperty("flubaroo_uid");
  if (flubaroo_uid == null || flubaroo_uid == "")
    {
      // user has never installed Flubaroo before (in any spreadsheet)
      var dt = new Date();
      var ms = dt.getTime();
      var ms_str = ms.toString();
 
      up.setProperty("flubaroo_uid", ms_str);
      logFirstInstall();
    }
}

// Spreadsheet Access
// ==================

 // setCellValue:
 // Given a reference to a sheet, and a row and column number (starts  
 // from 1), writes the value given into the cell specified by the row
 // and column.
 function setCellValue(sheet, row, col, value)
 {
   var single_cell = sheet.getRange(row, col, 1, 1);
   single_cell.setValue(value);
 }
 
 // getCellValue
 // Given a reference to a sheet, and a row and column number (starts
 // from 1), returns the value given in the cell specified by the row
 // and column.
 function getCellValue(sheet, row, col)
 {
   var single_cell = sheet.getRange(row, col, 1, 1);
   return single_cell.getValue();
 }
 
 // setCellColor
 // Given a reference to a sheet, and a row and column number (starts  
 // from 1), changes the background color (to the value specified)
 // for the cell in the row and col given.
 function setCellColor(sheet, row, col, color)
 {
   var single_cell = sheet.getRange(row, col, 1, 1);
   single_cell.setBackgroundColor(color);
 }

// In the past these reads have been cached but that caused problems 
// with autograding and testing didn't measure any difference in
// time taken.
function singleRowToArray(sheet, row_num, num_cols)
{
  var result = [];

  if (num_cols === -1) 
    {
      // Get all of the columns.
      num_cols = sheet.getLastColumn();
    }

  // Read in the values for this row.
  result = sheet.getRange(row_num, 1, 1, num_cols).getValues()[0];
  
  return result; 
}

function singleRowOfNotesToArray(sheet, row_num, num_cols)
{
  var result = [];

  if (num_cols === -1) 
    {
      // Get all of the columns.
      num_cols = sheet.getLastColumn();
    }

  // Read in the values for this row.
  result = sheet.getRange(row_num, 1, 1, num_cols).getNotes()[0];
  
  return result; 
}

function clearNotesOnSubmRow(subm_sheet, row_num)
{
  var r = subm_sheet.getRange(row_num, 1, 1, subm_sheet.getLastColumn());
  
  r.clearNote();
}

// writeArrayToRow:
// Given an array of values, writes it out to the row of the sheet specified.
// Row ids start from 1. Note that this will override any pre-existing content
// in the affected cells of that row.
// The row need not exist ahead of time.
function writeArrayToRow(sheet, row_num, start_col, row_values, bold, color)
{
   var row_range = sheet.getRange(row_num, 1, start_col, row_values.length);
   var set_of_rows = new Array(1);
   var result;
   
   set_of_rows[0] = row_values;
  
   if (bold)
     {
       row_range.setFontWeight("bold");
     }
  
   if (color)
     {
       row_range.setBackgroundColor(color);
     }
  
   result = row_range.setValues(set_of_rows);
    
   Debug.assert(result !== null, "writeArrayToRow() - Failed to write values");
}

// Misc
// ====

// setNotification()
// -----------------

setNotification = function(ss, title, msg)
{
  // TODO_AJR - Internationalize.
  
  ss.toast(msg, title, 300);
  
} // setNotification()
  
// deleteTrigger()
// ---------------

deleteTrigger = function(trigger_id)
{
  // Locate a trigger by unique ID.
  var t = getTrigger(trigger_id);

  if (!t) 
    {
      // trigger not found
      Debug.warning("Trigger " + trigger_id + " didn't exist, so could not delete!");
      return false;
    }
  
  // Found the trigger so delete it.
  try
    {
      ScriptApp.deleteTrigger(t);
    }
  catch(e)
    {
      Debug.warning("deleteTrigger() - unable to delete existing trigger: " + e);  

      // trigger didn't exist
    }
  
  return true;
  
  
} // deleteTrigger()
  

// getTrigger()
// ---------------

getTrigger = function(trigger_id)
{
  // Locate a trigger by unique ID.
  var all_triggers = ScriptApp.getProjectTriggers(); 
  var i;
  var found_trigger = null;
  
  Debug.info("getTrigger - searching for trigger: " + trigger_id);
  
  // Loop over all triggers.
  for (i = 0; i < all_triggers.length; i++) 
    {
      if (all_triggers[i].getUniqueId() === trigger_id) 
        {
          Debug.info("found trigger " + trigger_id);
          found_trigger = all_triggers[i];
          break;
        }
    }

  return found_trigger;

} // getTrigger()
  


// createPdfCertificate()
// ----------------------
//
// The code is based on the "Bus Conduct Report" script by 
// TJ Houston tjhouston.com (tj@tjhouston.com).

// TODO_AJR - Make sending a certificate configurable. At the moment you can
// disable the feature by not defining the template ID and name.
// TODO_DAA - Figure out a way to integrate this into Flubaroo.
function createPdfCertificate(keys)
{
  Debug.info("createPdfCertificate()");

  if (DOC_TEMPLATE === "" || DOC_NAME === "")
    {
      Debug.info("createPdfCertificate() - No certificate available");
      return null;
    }

  // Get document template, copy it as a new temp doc, and save 
  // the Doc’s id.
  var copy_id = DocsList.getFileById(DOC_TEMPLATE)
                        .makeCopy(DOC_NAME + ' for ' + keys["<NAME>"])
                        .getId();
  
  // Open the temporary document.
  var copy_doc = DocumentApp.openById(copy_id);
  
  // Get the document’s body section.
  var copy_body = copy_doc.getActiveSection();
  
  // Replace place holder keys,in our google doc template.
  for (var key in keys)
    {
      copy_body.replaceText(key, keys[key]);
    }
  
  // Save and close the temporary document.
  copy_doc.saveAndClose();
  
  // Convert temporary document to PDF by using the getAs blob conversion.
  var pdf = DocsList.getFileById(copy_id).getAs("application/pdf"); 
  
  // Delete temp file.
  DocsList.getFileById(copy_id).setTrashed(true);

  return pdf;
  
} // createPdfCertificate()

// strTrim:
// Trims the whitespace before and after the string.
// Necessary b/c sometimes cells from Form submissions have extra whitespace
// at the beginning for some reason, leading to "wrong" answers when graded.
function strTrim(str) 
{
  return str.replace(/^\s+|\s+$/g,"");
}

 // floatToPrettyText:
 // Takes a float like 22.123456789 and returns "22.12".
 // Note: this function will return 2 digits past the decimal, but will
 // do so without rounding.
 function floatToPrettyText(f)
 {
   s1 = f + ""; // float to string
   sp = s1.split("."); // split at decimal
 
   s2 = sp[0] + ".";
   if (sp.length > 1)
     {
       s2 = s2 + sp[1].substring(0,2);
     }
   else
     {
       s2 = s2 + "00";
     }
 
   return s2;
 }
 
 // renameSubmissionsSheet:
 // Rename "Sheet1" to something more friendly to enhance useability. When
 // looking for the submissions in the future, we'll refer to the spreadsheet
 // with this name.
 // TODO: Make sure this doesn't prevent future submissions
 // Returns:
 //    STATUS_OK if rename successful.
 //    STATUS_NOT_FOUND if 'Sheet1' sheet not present.
 //    STATUS_NO_EFFECT if 'Sheet1' had previously been renamed, and so another
 //      rename wasn't done.
 function renameSubmissionsSheet()
 {
   var ss = SpreadsheetApp.getActiveSpreadsheet();
   var sheet = ss.getSheetByName(langstr("FLB_STR_SHEETNAME_STUD_SUBM"));
   if (sheet)
     {
       // sheet has already been renamed.
       return STATUS_NO_EFFECT;
     }
   
   // for non-english languages, try with the older (english) style name.
   // might still be laying around from when they changed languages.
   var sheet = ss.getSheetByName(gbl_subm_sheet_name);
   if (sheet)
     {
       // sheet has already been renamed.
       return STATUS_NO_EFFECT;
     }
   
   var all_sheets = ss.getSheets();
   if (all_sheets.length == 1)
     {
       // Only 1 sheet. Assume it has the student submissions, and
       // rename it to something more friendly (and which we can refer
       // to later).
       sheet = all_sheets[0];
       sheet.setName(langstr("FLB_STR_SHEETNAME_STUD_SUBM"));
       return STATUS_OK;
     }
   else if (all_sheets.length > 1)
     {
       // More than one sheet. If can find "Form Responses 1", assume this one has
       // the submissions and rename it.
       sheet = ss.getSheetByName("Form Responses 1");
       if (sheet != null)
         {
           // Rename it to something more friendly.
           sheet.setName(langstr("FLB_STR_SHEETNAME_STUD_SUBM"));
           return STATUS_OK;
         }
     }
 
   // Can't locate sheet with submissions. Tell the user.
   return STATUS_NOT_FOUND;
 }

// getTipsRow:
function getTipsRow(subm_sheet)
{
  if (subm_sheet.getLastRow() < 2)
	{
	  return null;
	}
  
  // Get the help tips from the second row.
  var help_tips_vals = singleRowToArray(subm_sheet,
                                        2,
                                        getNumQuestionsFromSubmissions(subm_sheet));

  if (help_tips_vals[0] !== "")
    {
      return null;
    }
  
  return help_tips_vals;
}

function showNewVersionNotice()
{
  // check if this is the first time the user has upgrade to or installed a new
  // version of Flubaroo. if so, just this once, we'll show them a message.
  if (justUpgradedFirstTime())
    {
      if (gbl_show_version_update_notice && (langstr("FLB_STR_NEW_VERSION_NOTICE") != ""))
        {
          Browser.msgBox("New Flubaroo Version!", langstr("FLB_STR_NEW_VERSION_NOTICE"),
                         Browser.Buttons.OK);
        }
    }
}

// invalidateGradesOnUpdate:
// Returns true if this is the first time user has upgraded to or installed
// a new version of Flubaroo in this spreadsheet, and the format of the
// grades sheet has changed as a result of the new version
function invalidateGradesOnUpdate()
{
  var dp = PropertiesService.getDocumentProperties();   

  // Let the user know if this is a new version.
  var sver = dp.getProperty(DOC_PROP_SHEET_INSTALLED_VERSION);
  
  // new version doesn't get set in properties until assignment
  // is first graded after upgrading.
  if (((sver == null) || (sver != gbl_version_str)) && gbl_invalidate_grades_on_update)
    {
      return true;
    }
  
  return false;
}

// justUpgradedFirstTime:
// Returns true if this is the first time the user has upgrade to or installed a new
// version of Flubaroo.
function justUpgradedFirstTime()
{
  var up = PropertiesService.getUserProperties();   
  var uver = up.getProperty(USER_PROP_LATEST_VERSION_INSTALLED);
  
  // new version doesn't get set in properties until assignment
  // is first graded after upgrading.
  if ((uver == null) || (uver != gbl_version_str))
    {
      return true;
    }
  
  return false;
}

function deleteAllProjectTriggers()
{
  var all_triggers = ScriptApp.getProjectTriggers();
  
  Debug.info("first deleting any existing triggers. there are this many: " + all_triggers.length);
  for (var i = 0; i < all_triggers.length; i++)
    {
      try
        {
          ScriptApp.deleteTrigger(all_triggers[i]);
        }
      catch(e)
        {
          Debug.warning("unable to delete a trigger: " + e);
          continue;
        }
    } 
}