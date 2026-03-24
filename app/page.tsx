import Link from 'next/link'

export default function Home() {
	return (
		<main>
			<h1>Home</h1>
			<ul>
				<li>
					<Link href='/xml-generator'>XML Generator</Link>
				</li>
				<li>
					<Link href='/brand-mapper'>Brand Mapper</Link>
				</li>
				<li>
					<Link href='/image-collection-creator'>Image Collection Creator</Link>
				</li>
			</ul>
		</main>
	)
}
