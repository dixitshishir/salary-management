# Serves the built React app for every non-API page, so client-side routes
# like /insights work on a full page load. The build is renamed to app.html
# (not index.html) so ActionDispatch::Static doesn't serve it at "/" with the
# long public cache header meant for hashed assets.
class FrontendController < ApplicationController
  def index
    page = Rails.public_path.join("app.html")
    return render plain: "Frontend not built. Run `npm run build` in frontend/ or use the Vite dev server.", status: :not_found unless page.exist?

    response.headers["Cache-Control"] = "no-cache"
    send_file page, type: "text/html", disposition: "inline"
  end
end
