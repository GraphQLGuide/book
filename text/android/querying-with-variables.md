---
title: Querying with variables
---

# Querying with variables

> If you’re jumping in here, `git checkout 2_1.0.0` (tag [2_1.0.0](https://github.com/GraphQLGuide/guide-android/tree/2_1.0.0), or compare [2...3](https://github.com/GraphQLGuide/guide-android/compare21_1.0.0...3_1.0.0))

Once we click a chapter, we see “No sections,” which is true for the Preface but not for the other chapters. We need to query for the list of sections in the selected chapter. So let’s add a query document:

`app/src/main/graphql/guide/graphql/toc/Sections.graphql`

```gql
query Sections($id: Int!) {
  chapter(id: $id) {
    sections {
      number
      title
    }
  }
}
```

After saving the file, we rebuild to get the new `SectionsQuery` class generated and code completion working. 

The query needs the current chapter’s `id`, which we have in the fragment’s `chapterId` argument. We can execute the query as we did before in `onViewCreated()`, replacing `showErrorMessage("No sections")` with:

`app/src/main/java/guide/graphql/toc/ui/sections/SectionsFragment.kt`

```kt
import androidx.lifecycle.lifecycleScope
import com.apollographql.apollo.coroutines.toDeferred
import com.apollographql.apollo.exception.ApolloException
import guide.graphql.toc.SectionsQuery
import guide.graphql.toc.data.Apollo

class SectionsFragment : Fragment() {
  ...

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    ...

    lifecycleScope.launchWhenStarted {
      binding.spinner.visibility = View.VISIBLE
      binding.error.visibility = View.GONE
      try {
        val response = Apollo.client.query(
          SectionsQuery(id = args.chapterId)
        ).toDeferred().await()

        if (response.hasErrors()) {
          throw Exception("Response has errors")
        }

        val sections = response.data?.chapter?.sections ?: throw Exception("Data is null")

        if (sections.size > 1) {
          adapter.updateSections(sections)
          binding.spinner.visibility = View.GONE
          binding.error.visibility = View.GONE
        } else {
          throw Exception("No sections")
        }
      } catch (e: ApolloException) {
        showErrorMessage("GraphQL request failed")
      } catch (e: Exception) {
        showErrorMessage(e.message.orEmpty())
      }
    }
  }
}
```

We include the variable like this: `SectionsQuery(id = args.chapterId)`, and as before, we either show an error message or update the adapter. When the API returns a single section for a chapter, it’s actually a sectionless chapter, like the Preface.

We need to implement the adapter’s `updateSections()` function. For the argument type, we can use the generated `SectionsQuery.Section` data class:

`app/src/main/java/guide/graphql/toc/ui/sections/SectionsAdapter.kt`

```kt
import guide.graphql.toc.SectionsQuery

class SectionsAdapter(
  private val context: Context,
  private val chapterNumber: Int,
  private var sections: List<SectionsQuery.Section> = listOf()
) : RecyclerView.Adapter<SectionsAdapter.ViewHolder>() {
  ...

  fun updateSections(sections: List<SectionsQuery.Section>) {
    this.sections = sections
    notifyDataSetChanged()
  }

  override fun getItemCount(): Int {
    return sections.size
  }

  override fun onBindViewHolder(holder: ViewHolder, position: Int) {
    val section = sections[position]
    section.let {
      holder.binding.sectionTitle.text = context.getString(
        R.string.section_title,
        chapterNumber.toString(),
        section.number.toString(),
        section.title
      )
    }
  }
}
```

Now when we select Chapter 2, we see the list of sections 💃.

![The second page with all sections listed](../img/android-sections.png)

