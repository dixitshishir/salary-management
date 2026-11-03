# A country ACME pays people in, loaded from config/countries.yml.
# Plain Ruby rather than a table: the list changes rarely, and keeping it in a
# versioned file means every USD figure can be traced back to a dated rate.
class Country
  CONFIG_PATH = Rails.root.join("config/countries.yml")

  attr_reader :code, :name, :currency

  def initialize(code:, name:, currency:, per_usd:)
    @code = code
    @name = name
    @currency = currency
    # String -> Rational keeps 0.76 exact; Float#to_r would not.
    @per_usd = per_usd.to_s.to_r
  end

  def to_usd(amount)
    (amount.to_r / @per_usd).round
  end

  # Unrounded, for callers that apply their own rounding.
  def from_usd(amount)
    amount.to_r * @per_usd
  end

  class << self
    def all = registry.values

    def find(code) = registry[code.to_s.upcase]

    def codes = registry.keys

    def rates_as_of = Date.iso8601(config.fetch("as_of"))

    private

    def registry
      @registry ||= config.fetch("countries").to_h do |code, attrs|
        [ code, new(code:, name: attrs.fetch("name"), currency: attrs.fetch("currency"), per_usd: attrs.fetch("per_usd")) ]
      end
    end

    def config
      @config ||= YAML.safe_load_file(CONFIG_PATH)
    end
  end
end
