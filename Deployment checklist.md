* Deployment checklist 
** (use this every time)

*** Change code (repo)

*** `yarn build` (or your turbo build) → confirm dist/b2b-portal.js timestamp/size changed

*** Copy b2b-portal.js + b2b-portal.css into assets/content/buyer-portal/assets/ in your theme

*** stencil push and activate the new theme version



* Testing
** Optional
*** Load /account.php → Network shows .../stencil/<buildId>/content/buyer-portal/assets/b2b-portal.js?v=<sameBuildId> (200)

*** In the b2b-portal.js response, find your edited string