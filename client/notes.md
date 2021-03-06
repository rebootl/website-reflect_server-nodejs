## ToDo

* add entries (on prod.):
  - code examples
* images access private protected by hash?
* image upload "TypeError: NetworkError when attempting to fetch resource."
  when server offline
* tests?
* naming conventions css?
* make everything async?
* check if entry id exists already maybe

### Current

* multi-user/platform POG
  - use a real database instead of a JSON file (mongoDB)
* direct link doesn't work when not logged in -> hard to debug, projectData-client issue
* "TypeError: newLastli is null" on login/logout -> reproduce

### Features

* JWT expiry/renewal
* back button for single entry view
* syntax highlighting
* edit preview
* search
* hide/show menu -> CSS rework
* show synced status (using entry property)
* online/offline indicator
* early prevent creating duplicate tags inside add-items (would be nice)
* maybe rework edit-input to "query" input instead
* flash message after saving, message system?
* reset selection if input "emptied" in create-entry
  (needs fixing in the reset functions to prevent too much recursion)
* use service worker for offline capability
* check script/view for duplicate id's, broken links
* encrypt private entries

### Bugs / code cleanup

* setting inspector localapi doesn't work -> what was this?
* checkbox click on label triggers event but not checkmark -> do on design rework
* make input-detection it's own component
* projectdata not loading on ffox mobile -> projectData, transpile maybe?
* improve client filestructure (make subdirectories for components)
* cleanups
  - cleanup console logs, more cleanups?
  - cleanup function naming (camelCase)
  - use connectedCallback for all elements
* use selection-box comp. in menu
* router
  - don't update from router if url doesn't effectively changed
  - update url inside router
  - rework

### Design/UI/UX adaptions/improvements

* show/hide private entries
* collapse entries
* add favicon
* rework CSS
* accessibility: topics-list not using keyboard tabs
* icon-button focus in chromium pixel error at bottom
* fix spacing on link detection labels -> try using flex

### Test in production LUL

* cannot reload after unclean browser exit -> should be fixed by projectData-client update

### Done

* wired link title is not correctly parsed => FIXED
* pagination => DONE
* protect url info request route => DONE
* source doesn't get updated => UNCLEAR -> what was this?
* re-login necessary after server update,
  otherwise new entries/edits not shown => DUPLICATE
  -> more likely after browser crash/unclean exit
  -> see other issue
* lock add images for links => DONE
* make "input-overlay" it's own component => DONE
* edit looses image comment sometimes!!? => FIXED
* editing link and saving leads to empty text !! => FIXED
* changing text and saving deletes image comment => FIXED
* add images
  - if image locally not found, maybe on other device => DONE
  - cleanup local image db on logout => DONE
  - keep local new image and upload local stored one looses new image
    => RESOLVED, only happens on ffox throttled mode
  - abort image upload => DONE
    - delete on server in case of failure of another image => RESOLVED,
      making one request for multiple images, fixed deletion on server
    - implement for edit-images => DONE
  - edit-images "save and close", when new image broken? => FIXED,
    couldn't reproduce anymore
* detection trigger not 100% reliable, i think if the detection takes
  longer than the input it will not re-trigger after input is finished,
  tho it's probably not too terrible cause links will be pasted most of
  the time... => WONTFIX, for now
* cleanup/remove old request functions => DONE
* image dir must be docker volume => DONE
* storing entry when unchanged results in empty text => DONE
* tag after creation not active, can lead to accidental deletion
  when saving again => FIXED
* sorting not correct sometimes
  -> caused by missing pinned attr.?
  => FIXED by editing/resaving entries
* fix the flickering during link input => DONE
* fix link detection (server side) => DONE
* add pinned entries => DONE, also made buttons and icons etc.
* redirect after delete not working, also console.log not => FIXED (typo)
* delete entries => DONE, inactivate maybe later
* maybe add direct toggle for private/pinning => NOPE, would lead to
  cluttered UI
* improve small tags style => DONE
* cannot access in private mode? => WONTFIX, indexdb doesn't work
* integrate project-Data => DONE
* check for multiple topics/tags => DONE
* console log link info request error, instead of using it in title => DONE
* empty comment should be empty string => DONE
* remove console log view-single-entry => DONE
* fix link css margins => DONE
* edit-entry cancel button => DONE
* use checkbox for private/public on edit view => DONE
* redirect after saving edit => DONE, "Save and Close" button
* add edit-view => DONE
* remove dashed border css => DONE
* link creation broken => FIXED
* url detection broken, "todo:" is a url... => FIXED
* click logo to "home" view => DONE
* add page not found output if entry id not found => DONE
* fix create buttons => DONE
* fix triggers => DONE
  - entries-list update
  - auto show/hide create entry on logout/login
* make entry input a textarea => DONE
* get rid of the global_state user obj. => DONE
* add new-entry input elements => DONE
* make new/edit elements for topics and subtags => OBSOLETE
* Server side: change db public/private field => OBSOLETE
* date string has an error => FIXED, using moment.js for now
* update stuff on login/logout => FIXED, done by proj. Data now
* add pinned entries ==> DONE
