# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end
# Create a default user
default_user = User.find_or_create_by!(email_address: "default@example.com") do |user|
  user.password = "password"
  user.password_confirmation = "password"
end

default_user.update!(admin: true) unless default_user.admin?

puts "Default user created with email: #{default_user.email_address} and password: password (admin: #{default_user.admin?})"
