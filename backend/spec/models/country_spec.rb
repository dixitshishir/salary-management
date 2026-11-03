require "rails_helper"

RSpec.describe Country do
  it "loads every configured country with its currency" do
    india = described_class.find("IN")

    expect(india.name).to eq("India")
    expect(india.currency).to eq("INR")
  end

  it "lists codes for validation" do
    expect(described_class.codes).to include("IN", "US", "GB")
  end

  it "returns nil for an unknown code" do
    expect(described_class.find("XX")).to be_nil
  end

  it "converts local amounts to whole US dollars" do
    expect(described_class.find("IN").to_usd(8_800_000)).to eq(100_000)
    expect(described_class.find("US").to_usd(123_456)).to eq(123_456)
  end

  it "exposes the date the exchange rates were fixed" do
    expect(described_class.rates_as_of).to eq(Date.new(2026, 11, 1))
  end
end
