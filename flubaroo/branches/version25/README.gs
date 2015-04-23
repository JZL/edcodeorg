// Change Log:
//   Version 1.0, 3/7/11: Initial release
//   Version 1.1, 3/22/11: Fixed bug with emailing of grades
//                         and added percent column.
//   Version 1.2, 6/28/11: Fixed serverChangeHandler problem,
//                         and whitespace problem.
//   Version 1.3, 11/30/11: Added Google Analytics tracking
//   Version 2.0, 1/17/12:  Major rewrite and feature additions. See blog
//                         post (flubaroo.com/blog) for list of new features. Internally,
//                         got rid of need for findPresentedQuestion
//                         function by changing grading options row.
//                         Added extra hidden rows to make 'Grades' self-contained.
//                         Broke 'flubaroo.gas' into multiple files.
//   Version 2.1, 11/29/12: Fixes for issues 8 and 9.

/*   Version 3.0, 6/24/13:
     Many changes in this version. The code has been compltely re-written from scratch
     (an effort which started a year ago) to make it easier to modify and extend by myself
     and others. Also:
      
      Bug / Issue fixes:
      - Fix for recent bug in which Flubaroo runs forever (sheet reference issue)
      - Issue 1 resolved
      
      New Features:
      - Flubaroo won't re-email students who have already been emailed (Issue 2).
      - Flubaroo can now send an optional help tip per question to students in the email (Issue 3).
*/                

//   Version 3.01, 6/26/13: Quick fix for answer key issue reported (issue 37).
//   Version 3.02, 11/1/13: Fix for issues 39, 65, and 66. 
//   Version 3.1, 1/2/14: Implementation of number ranges by Andrew Roberts (issue 42), andrewroberts.net.
//   Version 3.11 1/8/14: Quick fix for issue that affects TRUE/FALSE question types, introduced in 3.1.

//   Version 12 3/11/14: First release for new Google sheets & Add-ons. Introducing new, simpler versioning scheme (just a number). 
//                       Functinally the same as version 3.11, with the exception of some improved error handling.

//   Version 13 6/9/14: Fixed %or bug (issue 86), fixed minor issue with "Incorrect" text in emails sent, and modified 
//                      multiple language support to make it easier for contributors to localize Flubaroo. Added in notice
//                      if user is over their daily email quota. Also added in translations for Swedish, Dutch, and Russian.
//
//   Version 14 7/18/14: Introduced translations for French, French-Canadian, and Hebrew.
//   Version 15 8/31/14: Introduced %cs operator for case-sensitive grading (Issue #20).
//   Version 16 10/29/14: Changes auth dialog (on install) to clarify that Flubaroo only accesses info in the spreadsheets
//                        where it's installed.
//   Version 17 12/5/14: Launch of autograde feature! Also introduced advanced option menu.
//   Version 18 12/6/14: Small modification to speed-up autograding when there are multiple concurrent submissions.
//   Version 19 12/10/14: Fixing issue where autograde can't be disabled due to missing formSubmit trigger.
//                       Also reverted lock logic to how Andrew had it in his branch, as seeing some user-reported errors.
//   Version 20 12/12/14: Added fieldlog functionality. Also created new, simpler non-auth menu to clearup confusion
//                        on why Autograde couldn't be setup initially in a sheet where Flubaroo hadn't been used yet.
//                        Lastly, added extra code to ensure that (a) autograde can always be disabled and (b) multiple
//                        onSubmit triggers don't somehow pile up.
//   Version 21 12/15/14: Removed "toast" notification about autograde from onOpen. Fixed a properties issue when 
//                        writing grades that was affecting assignments with > 200 submissions.
//   Version 22 12/16/14: Added gradesSheetIsValid() check to ensure we dont' die trying to read invalid Grades sheet.
//                        Added Autograde.stillRunning() to fix issue with menu when autograde dies and leaves RUNNING
//                        property set.
//   Version 23 3/8/15:   Added Flubaroo Tips when grading completes.
//   Version 24 3/26/15:  Changed locking mechanism for autograde.
//   Version 25 4/1/15:   Removed code to delete all existing triggers when turning on autograde. This wasn't local to
//                        the sheet, and was actually disabling autograde across multiple sheets.


