require "rails_helper"

RSpec.describe "React app fallback" do
  let(:page) { Rails.public_path.join("app.html") }

  context "when the frontend has been built" do
    around do |example|
      existed = page.exist?
      page.write("<html><body>ACME Salary Manager</body></html>") unless existed
      example.run
    ensure
      page.delete if !existed && page.exist?
    end

    it "serves the app for client-side routes, without caching" do
      get "/insights", headers: { "Accept" => "text/html" }

      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("text/html")
      expect(response.headers["Cache-Control"]).to eq("no-cache")
      expect(response.body).to include("ACME Salary Manager")
    end

    it "serves the app at the root" do
      get "/", headers: { "Accept" => "text/html" }

      expect(response).to have_http_status(:ok)
    end

    it "does not serve the app for unknown API paths" do
      get "/api/nope", headers: { "Accept" => "text/html" }

      expect(response).to have_http_status(:not_found)
      expect(response.body).not_to include("ACME Salary Manager")
    end
  end

  it "explains how to build the frontend when it is missing" do
    allow(Rails).to receive(:public_path).and_return(Pathname.new(Dir.mktmpdir))

    get "/", headers: { "Accept" => "text/html" }

    expect(response).to have_http_status(:not_found)
    expect(response.body).to include("npm run build")
  end
end
