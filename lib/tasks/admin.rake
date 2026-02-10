namespace :admin do
  desc "Grant admin role to a user by email"
  task :grant, [ :email ] => :environment do |_t, args|
    abort "Usage: rake admin:grant[user@example.com]" if args[:email].blank?

    user = User.find_by(email_address: args[:email])
    abort "User not found: #{args[:email]}" unless user

    user.update!(admin: true)
    puts "Admin granted to #{user.email_address}"
  end

  desc "Revoke admin role from a user by email"
  task :revoke, [ :email ] => :environment do |_t, args|
    abort "Usage: rake admin:revoke[user@example.com]" if args[:email].blank?

    user = User.find_by(email_address: args[:email])
    abort "User not found: #{args[:email]}" unless user

    user.update!(admin: false)
    puts "Admin revoked from #{user.email_address}"
  end
end
