#!/usr/bin/env python3
import json
import sys
from pathlib import Path

class Resident:
    def __init__(self, res_id, last_name="", first_name="", email="", address="", 
                 year_born=2000, gender="", age=0, payment=0, net_tax=0, 
                 age_ubi=0, alive=True, charity=0, property=0, children=0, child=0,
                 sunlight=0, wealth=0, voting=False, jury_duty=False, disabled=False,
                 year=0, census=""):
        self.res_id = res_id
        self.last_name = last_name
        self.first_name = first_name
        self.email = email
        self.address = address
        self.year_born = year_born
        self.gender = gender
        self.age = age
        self.payment = payment
        self.net_tax = net_tax
        self.age_ubi = age_ubi
        self.alive = alive
        self.charity = charity
        self.property = property
        self.children = children or child
        self.sunlight = sunlight
        self.wealth = wealth
        self.voting = voting
        self.jury_duty = jury_duty
        self.disabled = disabled
        self.year = year
        self.census = census
    
    def to_dict(self):
        return self.__dict__
    
    @staticmethod
    def from_dict(d):
        return Resident(**d)

class ResidentRegistry:
    def __init__(self, filename="residents.json"):
        self.filename = filename
        self.residents = {}
        self.load()
    
    def load(self):
        if Path(self.filename).exists():
            with open(self.filename) as f:
                data = json.load(f)
                self.residents = {int(k): Resident.from_dict(v) for k, v in data.items()}
    
    def save(self):
        with open(self.filename, 'w') as f:
            json.dump({k: v.to_dict() for k, v in self.residents.items()}, f, indent=2)
    
    def add(self, resident):
        self.residents[resident.res_id] = resident
        self.save()
    
    def get(self, res_id):
        return self.residents.get(res_id)
    
    def delete(self, res_id):
        if res_id in self.residents:
            del self.residents[res_id]
            self.save()
    
    def all(self):
        return sorted(self.residents.values(), key=lambda r: r.res_id)
    
    def by_status(self, key, value):
        return [r for r in self.residents.values() if getattr(r, key) == value]
    
    def search(self, query):
        q = query.lower()
        return [r for r in self.residents.values() 
                if q in r.last_name.lower() or q in r.first_name.lower() or q in r.email.lower()]

class Statistics:
    def __init__(self, registry):
        self.registry = registry
    
    def total_living(self):
        return len(self.registry.by_status('alive', True))
    
    def voting_age(self):
        return len(self.registry.by_status('voting', True))
    
    def by_gender(self):
        male = len([r for r in self.registry.all() if r.gender == 'M'])
        female = len([r for r in self.registry.all() if r.gender == 'W'])
        return {'male': male, 'female': female, 'other': len(self.registry.all()) - male - female}
    
    def total_charity(self):
        return sum(r.charity for r in self.registry.all())
    
    def total_payments(self):
        return sum(r.payment for r in self.registry.all())
    
    def total_taxes(self):
        return sum(r.net_tax for r in self.registry.all())
    
    def summary_report(self):
        gender = self.by_gender()
        return {
            'total_living': self.total_living(),
            'voting_age': self.voting_age(),
            'gender': gender,
            'total_charity': self.total_charity(),
            'total_payments': self.total_payments(),
            'total_taxes': self.total_taxes()
        }

class CLI:
    def __init__(self):
        self.registry = ResidentRegistry()
        self.stats = Statistics(self.registry)
    
    def list_residents(self):
        residents = self.registry.all()
        if not residents:
            print("No residents found")
            return
        print("\n{:<4} {:<15} {:<15} {:<8} {:<10} {:<10}".format(
            "ID", "Last Name", "First Name", "Age", "Payment", "Tax"))
        print("-" * 70)
        for r in residents:
            print("{:<4} {:<15} {:<15} {:<8} ${:<9} ${:<9}".format(
                r.res_id, r.last_name[:14], r.first_name[:14], r.age, r.payment, r.net_tax))
    
    def show_statistics(self):
        report = self.stats.summary_report()
        print("\n=== Community Statistics ===")
        print(f"Total Living Residents: {report['total_living']}")
        print(f"Voting Age Residents: {report['voting_age']}")
        print(f"Gender Breakdown: M={report['gender']['male']}, W={report['gender']['female']}")
        print(f"Total Charity: ${report['total_charity']}")
        print(f"Total Payments: ${report['total_payments']}")
        print(f"Total Taxes: ${report['total_taxes']}")
    
    def add_resident(self, data):
        resident = Resident(**data)
        self.registry.add(resident)
        print(f"Resident {resident.res_id} added successfully")
    
    def search(self, query):
        results = self.registry.search(query)
        if not results:
            print(f"No residents found matching '{query}'")
            return
        print(f"\nFound {len(results)} resident(s):")
        for r in results:
            print(f"  {r.res_id}: {r.first_name} {r.last_name} (Age: {r.age})")
    
    def export_json(self, filename="residents_export.json"):
        data = {k: v.to_dict() for k, v in self.registry.residents.items()}
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Exported {len(data)} residents to {filename}")

if __name__ == "__main__":
    cli = CLI()
    
    if len(sys.argv) < 2:
        print("Resident Management System")
        print("Usage: python app.py <command>")
        print("Commands: list, stats, search <query>, export")
        sys.exit(0)
    
    cmd = sys.argv[1]
    
    if cmd == "list":
        cli.list_residents()
    elif cmd == "stats":
        cli.show_statistics()
    elif cmd == "search":
        if len(sys.argv) > 2:
            cli.search(sys.argv[2])
    elif cmd == "export":
        filename = sys.argv[2] if len(sys.argv) > 2 else "residents_export.json"
        cli.export_json(filename)
    else:
        print(f"Unknown command: {cmd}")
